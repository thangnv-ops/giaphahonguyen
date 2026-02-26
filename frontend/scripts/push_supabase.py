import argparse
import os
from pathlib import Path

import psycopg2
from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parents[1]
MIGRATIONS_DIR = ROOT_DIR / "supabase" / "migrations"
SEED_FILE = ROOT_DIR / "supabase" / "seed.sql"


def parse_args():
    parser = argparse.ArgumentParser(
        description="Push schema/data từ frontend/supabase lên Supabase Postgres."
    )
    parser.add_argument(
        "--env-file",
        default=".env",
        help="Đường dẫn file env để load thông tin kết nối DB (mặc định: .env).",
    )
    parser.add_argument(
        "--bootstrap",
        action="store_true",
        help="Áp dụng toàn bộ migration SQL.",
    )
    parser.add_argument(
        "--with-seed",
        action="store_true",
        help="Nạp seed data từ supabase/seed.sql (thường chỉ dùng local/dev).",
    )
    return parser.parse_args()


def create_connection():
    db_url = os.getenv("SUPABASE_DB_URL")
    if db_url:
        return psycopg2.connect(db_url)

    user = os.getenv("user")
    password = os.getenv("password")
    host = os.getenv("host")
    port = os.getenv("port")
    dbname = os.getenv("dbname")
    sslmode = os.getenv("sslmode")

    params = {
        "user": user,
        "password": password,
        "host": host,
        "port": port,
        "dbname": dbname,
    }
    if sslmode:
        params["sslmode"] = sslmode

    return psycopg2.connect(**params)


def ensure_migration_history(cursor):
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS public.schema_migration_history (
          filename TEXT PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )


def is_migration_applied(cursor, filename):
    cursor.execute(
        "SELECT 1 FROM public.schema_migration_history WHERE filename = %s;",
        (filename,),
    )
    return cursor.fetchone() is not None


def mark_migration_applied(cursor, filename):
    cursor.execute(
        """
        INSERT INTO public.schema_migration_history(filename)
        VALUES (%s)
        ON CONFLICT (filename) DO NOTHING;
        """,
        (filename,),
    )


def run_bootstrap(connection):
    migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not migration_files:
        print(f"Không tìm thấy migration SQL trong: {MIGRATIONS_DIR}")
        return

    with connection.cursor() as cursor:
        ensure_migration_history(cursor)
        connection.commit()

    for migration_file in migration_files:
        filename = migration_file.name
        with connection.cursor() as cursor:
            if is_migration_applied(cursor, filename):
                print(f"Skip migration (đã áp dụng): {filename}")
                connection.commit()
                continue

            sql = migration_file.read_text(encoding="utf-8")
            print(f"Applying migration: {filename}")
            cursor.execute(sql)
            mark_migration_applied(cursor, filename)
            connection.commit()
            print(f"Applied migration: {filename}")


def run_seed(connection):
    if not SEED_FILE.exists():
        print(f"Không tìm thấy seed file: {SEED_FILE}")
        return

    sql = SEED_FILE.read_text(encoding="utf-8")
    with connection.cursor() as cursor:
        print(f"Applying seed: {SEED_FILE.name}")
        cursor.execute(sql)
        connection.commit()
        print(f"Applied seed: {SEED_FILE.name}")


def main():
    args = parse_args()
    env_path = Path(args.env_file)
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
    else:
        load_dotenv()

    should_bootstrap = args.bootstrap or (not args.bootstrap and not args.with_seed)

    connection = None
    try:
        connection = create_connection()
        print("Connection successful!")

        with connection.cursor() as cursor:
            cursor.execute("SELECT NOW();")
            result = cursor.fetchone()
            print("Current Time:", result)

        if should_bootstrap:
            run_bootstrap(connection)

        if args.with_seed:
            run_seed(connection)

    except Exception as e:
        if connection:
            connection.rollback()
        print(f"Failed to connect/push: {e}")
        raise
    finally:
        if connection:
            connection.close()
            print("Connection closed.")


if __name__ == "__main__":
    main()
