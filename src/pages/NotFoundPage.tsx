import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <section className="content-panel" aria-labelledby="not-found-title">
      <p className="eyebrow">404</p>
      <h1 id="not-found-title">页面不存在</h1>
      <p>当前地址没有对应的练习页面。</p>
      <Link className="secondary-action" to="/">
        回到首页
      </Link>
    </section>
  );
}

export default NotFoundPage;
