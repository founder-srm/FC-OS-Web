# Pushing Migrations

## Using Drizzle Kit:
1. Generate Migrations:
    ```bash
    npx drizzle-kit generate
    ```

3. Run Migrations:
    ```bash
    npx drizzle-kit migrate
    ```

## Using Supabase CLI:
1. Generate Migrations:
    ```bash
    npx drizzle-kit generate
    ```
2. Initialize the local Supabase project **(Only needed to be ran once)**:
    ```bash
    supabase init
    ```

3. Link it to your remote project **(Only needed to be ran once.)**:
    ```bash
    supabase link
    ```
4. Push changes to the database:
    ```bash
    supabase db push
    ```