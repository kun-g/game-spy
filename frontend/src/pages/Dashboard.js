import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Statistic, Select, Table, Spin, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { LikeOutlined, PlaySquareOutlined, PlusOutlined } from '@ant-design/icons';
import api from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const { Option } = Select;
const { Title: TitleText } = Typography;

function Dashboard() {
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState('poki');
  const [stats, setStats] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [topGames, setTopGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getStats(selectedPlatform, 30);
      setStats(response.data);
    } catch (error) {
      console.error('加载统计数据失败', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPlatform]);

  const loadTrendData = useCallback(async () => {
    try {
      const response = await api.getGamesTrend(selectedPlatform, 30);
      setTrendData(response.data);
    } catch (error) {
      console.error('加载趋势数据失败', error);
    }
  }, [selectedPlatform]);

  const loadTopGames = useCallback(async () => {
    try {
      const response = await api.getRankings(selectedPlatform, 5);
      setTopGames(response.data);
    } catch (error) {
      console.error('加载热门游戏失败', error);
    }
  }, [selectedPlatform]);

  useEffect(() => {
    if (selectedPlatform) {
      loadTopGames();
      loadTrendData();
      loadStats();
    }
  }, [selectedPlatform, loadTopGames, loadTrendData, loadStats]);

  const loadPlatforms = async () => {
    try {
      const response = await api.getPlatforms();
      setPlatforms(response.data);
      if (response.data.length > 0) {
        setSelectedPlatform(response.data[0]);
      }
    } catch (error) {
      console.error('加载平台列表失败', error);
    }
  };

  // 准备游戏趋势图表数据
  const getChartData = () => {
    if (!trendData) return null;

    const labels = trendData.map(item => item.date);
    const counts = trendData.map(item => item.count);

    return {
      labels,
      datasets: [
        {
          label: '每日新增游戏数',
          data: counts,
          fill: false,
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '每日新增游戏数量趋势',
      },
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const topGamesColumns = [
    {
      title: '游戏名称',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => <Link to={`/games/${record.id}`}>{text}</Link>,
    },
    {
      title: '好评',
      dataIndex: 'up_count',
      key: 'up_count',
      render: (text) => <span><LikeOutlined style={{ color: '#52c41a' }} /> {text}</span>,
    },
    {
      title: '差评',
      dataIndex: 'down_count',
      key: 'down_count',
      render: (text) => <span><LikeOutlined style={{ color: '#f5222d', transform: 'rotate(180deg)' }} /> {text}</span>,
    },
    {
      title: '好评率',
      dataIndex: 'positive_ratio',
      key: 'positive_ratio',
      render: (text) => `${(text * 100).toFixed(2)}%`,
    },
  ];

  return (
    <div>
      <div className="platform-selector">
        <Select 
          value={selectedPlatform} 
          style={{ width: 200 }} 
          onChange={value => setSelectedPlatform(value)}
        >
          {platforms.map(platform => (
            <Option key={platform} value={platform}>{platform.toUpperCase()}</Option>
          ))}
        </Select>
      </div>

      <Spin spinning={loading}>
        {stats && (
          <Row gutter={16}>
            <Col span={8}>
              <Card className="dashboard-card">
                <Statistic
                  title="总游戏数"
                  value={stats.total_games}
                  prefix={<PlaySquareOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card className="dashboard-card">
                <Statistic
                  title="近30天新增"
                  value={stats.new_games}
                  prefix={<PlusOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card className="dashboard-card">
                <Statistic
                  title="游戏分类"
                  value={stats.categories_count.length}
                />
              </Card>
            </Col>
          </Row>
        )}

        <Row gutter={16}>
          <Col span={24}>
            <Card className="dashboard-card">
              {trendData ? (
                <Line options={chartOptions} data={getChartData()} />
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>加载中...</div>
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Card className="dashboard-card">
              <TitleText level={4}>热门游戏 TOP 5</TitleText>
              <Table 
                dataSource={topGames} 
                columns={topGamesColumns} 
                rowKey="id" 
                pagination={false}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
}

export default Dashboard; 