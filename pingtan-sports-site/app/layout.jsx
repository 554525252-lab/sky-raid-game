import './globals.css';

export const metadata = {
  title: '平潭上门体育｜一对一定制训练',
  description: '平潭上门体育，少儿体能、减重塑形、中考体育、感统协调、成人塑形，一对一上门定制课程。'
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
