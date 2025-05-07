import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import './App.css';

import AppHeader from './components/AppHeader';
import AppSider from './components/AppSider';
import Dashboard from './pages/Dashboard';
import GamesList from './pages/GamesList';
import GameDetail from './pages/GameDetail';
import Rankings from './pages/Rankings';
import PlatformStats from './pages/PlatformStats';

const { Content } = Layout;

function App() {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <AppHeader />
        <Layout>
          <AppSider />
          <Layout style={{ padding: '0 24px 24px' }}>
            <Content
              style={{
                background: '#fff',
                padding: 24,
                margin: '24px 0',
                minHeight: 280,
                borderRadius: '4px',
              }}
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/games" element={<GamesList />} />
                <Route path="/games/:gameId" element={<GameDetail />} />
                <Route path="/rankings" element={<Rankings />} />
                <Route path="/stats" element={<PlatformStats />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </Router>
  );
}

export default App; 