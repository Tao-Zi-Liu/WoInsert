import {getRequestConfig} from 'next-intl/server';

const locales = ['en', 'zh'];

export default getRequestConfig(async ({locale}) => {
  // Just validate without throwing notFound
  if (!locales.includes(locale as any)) {
    console.warn(`Invalid locale: ${locale}, defaulting to 'en'`);
    locale = 'en';
  }

  return {
    messages: {
      login: {
        title: locale === 'zh' ? '登录' : 'Login',
        description: locale === 'zh' ? '输入您的账户信息。' : 'Enter your credentials to access your dashboard.',
        email: locale === 'zh' ? '邮箱' : 'Email',
        password: locale === 'zh' ? '密码' : 'Password',
        emailPlaceholder: locale === 'zh' ? '请输入您的邮箱地址' : 'Enter your email address',
        passwordPlaceholder: locale === 'zh' ? '请输入您的密码' : 'Enter your password',
        loginButton: locale === 'zh' ? '登录' : 'Login',
        loginSuccessful: locale === 'zh' ? '登录成功' : 'Login Successful',
        redirecting: locale === 'zh' ? '正在跳转到您的仪表板...' : 'Redirecting to your dashboard...',
        loginFailed: locale === 'zh' ? '登录失败' : 'Login Failed',
        invalidCredentials: locale === 'zh' ? '邮箱或密码无效。' : 'Invalid email or password.'
      },
      common: {
        loading: locale === 'zh' ? '加载中...' : 'Loading...',
        tagline: locale === 'zh' ? '专为生产卓越而设计。' : 'Built for production excellence.'
      }
    }
  };
});