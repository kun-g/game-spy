import React from 'react';
import { Layout, Typography } from 'antd';
import { CrownOutlined } from '@ant-design/icons';

const { Header } = Layout;
const { Title } = Typography;

function AppHeader() {
  return (
    <Header style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <CrownOutlined style={{ fontSize: '24px', color: '#fff', marginRight: '10px' }} />
        <Title level={4} style={{ color: '#fff', margin: 0 }}>
          Game Spy - 游戏数据监控平台
        </Title>
      </div>
    </Header>
  );
}

export default AppHeader; 