import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  AppstoreOutlined,
  TrophyOutlined,
  LineChartOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

function AppSider() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/') return '1';
    if (path.startsWith('/games') && !path.includes('/games/')) return '2';
    if (path.startsWith('/games/')) return '2';
    if (path === '/rankings') return '3';
    if (path === '/stats') return '4';
    return '1';
  };

  return (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={(value) => setCollapsed(value)}
      width={200}
    >
      <div className="logo">
        {!collapsed && 'Game Spy'}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={[getSelectedKey()]}
        selectedKeys={[getSelectedKey()]}
        items={[
          {
            key: '1',
            icon: <DashboardOutlined />,
            label: <Link to="/">仪表盘</Link>,
          },
          {
            key: '2',
            icon: <AppstoreOutlined />,
            label: <Link to="/games">游戏列表</Link>,
          },
          {
            key: '3',
            icon: <TrophyOutlined />,
            label: <Link to="/rankings">好评排行</Link>,
          },
          {
            key: '4',
            icon: <LineChartOutlined />,
            label: <Link to="/stats">平台数据</Link>,
          },
        ]}
      />
    </Sider>
  );
}

export default AppSider; 