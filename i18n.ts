import {getRequestConfig} from 'next-intl/server';

const locales = ['en', 'zh'];

export default getRequestConfig(async ({locale}) => {
  // Ensure locale is never undefined
  let validatedLocale = locale;
  
  if (!locale || !locales.includes(locale as any)) {
    console.warn(`Invalid locale: ${locale}, defaulting to 'en'`);
    validatedLocale = 'en';
  }

  return {
    locale: validatedLocale, // Now guaranteed to be a string
    messages: {
      login: {
        title: validatedLocale === 'zh' ? '登录' : 'Login',
        description: validatedLocale === 'zh' ? '输入您的账户信息。' : 'Enter your credentials to access your dashboard.',
        email: validatedLocale === 'zh' ? '邮箱' : 'Email',
        password: validatedLocale === 'zh' ? '密码' : 'Password',
        emailPlaceholder: validatedLocale === 'zh' ? '请输入您的邮箱地址' : 'Enter your email address',
        passwordPlaceholder: validatedLocale === 'zh' ? '请输入您的密码' : 'Enter your password',
        loginButton: validatedLocale === 'zh' ? '登录' : 'Login',
        loginSuccessful: validatedLocale === 'zh' ? '登录成功' : 'Login Successful',
        redirecting: validatedLocale === 'zh' ? '正在跳转到您的仪表板...' : 'Redirecting to your dashboard...',
        loginFailed: validatedLocale === 'zh' ? '登录失败' : 'Login Failed',
        invalidCredentials: validatedLocale === 'zh' ? '邮箱或密码无效。' : 'Invalid email or password.'
      },
      common: {
        loading: validatedLocale === 'zh' ? '加载中...' : 'Loading...',
        tagline: validatedLocale === 'zh' ? '专为生产卓越而设计。' : 'Built for production excellence.'
      }
    }
  };
});