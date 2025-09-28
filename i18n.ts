import {getRequestConfig} from 'next-intl/server';

const locales = ['zh']; // Chinese only

export default getRequestConfig(async ({locale}) => {
  // Always use Chinese
  const validatedLocale = 'zh';

  return {
    locale: validatedLocale,
    messages: {
      login: {
        title: '登录',
        description: '输入您的账户信息。',
        username: '用户名',
        password: '密码',
        usernamePlaceholder: '请输入用户名',
        passwordPlaceholder: '请输入密码',
        loginButton: '登录',
        loginSuccessful: '登录成功',
        redirecting: '正在跳转到您的仪表板...',
        loginFailed: '登录失败',
        invalidCredentials: '用户名或密码无效。'
      },
      common: {
        loading: '加载中...',
        tagline: '专为生产卓越而设计。'
      }
    }
  };
});