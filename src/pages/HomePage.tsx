import { Link } from 'react-router-dom';

const statusItems = [
  { label: '本周目标', value: '60 分钟' },
  { label: '当前阶段', value: '本地录音' },
  { label: '云端服务', value: '暂不接入' }
];

function HomePage() {
  return (
    <section className="home-page" aria-labelledby="home-title">
      <div className="hero-block">
        <p className="eyebrow">Phase 1</p>
        <h1 id="home-title">个人英语口语训练器</h1>
        <p className="hero-copy">
          先把每天的口语练习沉淀到本地录音里，建立稳定的练习、回放和复盘流程。
          第一阶段不会接入云端服务，也不会使用语音识别、语音合成或大模型。
        </p>
        <Link className="primary-action" to="/practice">
          开始练习
        </Link>
      </div>

      <div className="status-grid" aria-label="训练状态">
        {statusItems.map((item) => (
          <article className="status-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

export default HomePage;
