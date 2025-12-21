INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'superadmin' 
FROM auth.users 
WHERE email = 'alihajjaj930@icloud.com'
ON CONFLICT (id) DO UPDATE SET role = 'superadmin';