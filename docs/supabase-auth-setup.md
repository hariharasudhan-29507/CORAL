# Coral Supabase Auth Setup

Coral does not generate OTP codes locally. Supabase Auth creates, sends, and verifies the codes. The desktop app only calls Supabase and shows the right recovery states.

## Required Environment

Add these values to the root `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-for-gateway-only
VITE_OAUTH_REDIRECT_TO=http://localhost:5173
VITE_PASSWORD_RESET_REDIRECT_TO=http://localhost:5173
VITE_ENABLE_PHONE_OTP=true
```

Keep `SUPABASE_SERVICE_ROLE_KEY` out of the renderer. It is only for the gateway.

## Email Code Sign-In

In Supabase Dashboard:

1. Go to `Authentication > Providers > Email`.
2. Enable Email provider.
3. Keep OTP/email sign-in enabled.
4. Go to `Authentication > Email Templates`.
5. Open the `Magic Link` template.
6. Include the OTP token in the template body:

```html
<h2>Your Coral sign-in code</h2>
<p>Enter this code in Coral:</p>
<p>{{ .Token }}</p>
<p>This code expires shortly. If you did not request it, ignore this email.</p>
```

If the template only uses `{{ .ConfirmationURL }}`, Supabase sends a clickable link instead of a visible code. That is why Coral may say a code was sent but the email does not show one.

## Email Verification After Registration

In `Authentication > Email Templates`, open the `Confirm sign up` template and include either a link or a code. Coral supports the code path when the template includes `{{ .Token }}`:

```html
<h2>Verify your Coral account</h2>
<p>Enter this code in Coral:</p>
<p>{{ .Token }}</p>
<p>You can also include a verification link if you want browser-based confirmation.</p>
```

If you keep a link-only confirmation email, users should click the email link, then return to Coral and sign in.

## Phone OTP

In Supabase Dashboard:

1. Go to `Authentication > Providers > Phone`.
2. Enable Phone provider.
3. Configure a real SMS provider such as Twilio, MessageBird, Vonage, or Textlocal.
4. Keep phone numbers in E.164 format, for example `+919876543210`.
5. Set `VITE_ENABLE_PHONE_OTP=true` in `.env`.

Phone OTP will not send until Supabase Phone Auth and an SMS provider are both configured. For India, check SMS sender requirements such as DLT registration before production use.

## Google OAuth

In Supabase Dashboard:

1. Go to `Authentication > Providers > Google`.
2. Add the Google client ID and client secret.
3. Add the same redirect URL used in `VITE_OAUTH_REDIRECT_TO` to Supabase redirect allow-list settings.

Coral uses Supabase OAuth directly and stores only the Supabase session through the Supabase client.
