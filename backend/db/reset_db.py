from .database import reset_db, full_db_reset
import argparse
def main():
    parser = argparse.ArgumentParser(description="Reset the database. Leaves user-created content (flags, annotations) unless --full is specified")
    parser.add_argument('--full',action='store_true',help='Drop everything, including user-created content')
    args = parser.parse_args()
    if args.full:
        full_db_reset()
    else:
        reset_db()
    
if __name__ == "__main__":
    main()