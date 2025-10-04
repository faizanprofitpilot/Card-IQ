# Supabase Authentication Setup for Google OAuth Only

## Disable Email/Password Authentication

To make your app Google OAuth only, you need to disable email/password authentication in Supabase:

### Steps:

1. **Go to your Supabase Dashboard**
2. **Navigate to Authentication → Settings**
3. **Under "Auth Providers" section:**
   - **Disable "Email"** - Turn off email/password authentication
   - **Keep "Google" enabled** - This should remain on
4. **Save the changes**

### Alternative: Disable via SQL

You can also run this SQL in your Supabase SQL Editor:

```sql
-- Disable email/password authentication
UPDATE auth.config 
SET 
  enable_signup = false,
  enable_email_signup = false,
  enable_email_authentication = false
WHERE id = 1;
```

## Result

After making these changes:
- ✅ Users can only sign in with Google
- ❌ No email/password forms will work
- ✅ Your app will be Google OAuth only

## Test

1. Try to access `/dashboard` without being signed in
2. You should be redirected to the landing page
3. Click "Get Started with Google" 
4. Complete Google OAuth flow
5. You should be redirected to the dashboard

Your app is now Google OAuth only! 🎉
