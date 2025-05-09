import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Typography, Table, Select, Spin, Statistic, Divider, Progress } from 'antd';
import { 
  PlaySquareOutlined, 
  PlusOutlined, 
  AppstoreOutlined 
} from '@ant-design/icons';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const { Option } = Select;
const { Title: TitleText } = Typography;

function PlatformStats() {
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState('poki');
  const [stats, setStats] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);  // 默认30天

  useEffect(() => {
    loadPlatforms();
  }, []);

  useEffect(() => {
    if (selectedPlatform) {
      loadStats();
      loadTrendData();
    }
  }, [selectedPlatform, timeRange]);

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

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getStats(selectedPlatform, timeRange);
      setStats(response.data);
    } catch (error) {
      console.error('加载统计数据失败', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPlatform, timeRange]);

  const loadTrendData = useCallback(async () => {
    try {
      const response = await api.getGamesTrend(selectedPlatform, timeRange);
      setTrendData(response.data);
    } catch (error) {
      console.error('加载趋势数据失败', error);
    }
  }, [selectedPlatform, timeRange]);

  useEffect(() => {
    if (selectedPlatform) {
      loadStats();
      loadTrendData();
    }
  }, [selectedPlatform, timeRange, loadStats, loadTrendData]);

  // 准备分类数量图表数据
  const getCategoryData = () => {
    if (!stats || !stats.categories_count) return null;

    // 只展示前10个分类，其余归为"其他"
    let topCategories = [...stats.categories_count].sort((a, b) => b.game_count - a.game_count);
    
    let labels = [];
    let data = [];
    let colors = [];

    if (topCategories.length > 10) {
      const top10 = topCategories.slice(0, 10);
      const others = topCategories.slice(10);
      
      // 计算"其他"分类的总游戏数
      const othersCount = others.reduce((sum, item) => sum + item.game_count, 0);
      
      // 添加前10个分类
      labels = top10.map(item => item.category);
      data = top10.map(item => item.game_count);
      
      // 添加"其他"分类
      labels.push('其他');
      data.push(othersCount);
    } else {
      labels = topCategories.map(item => item.category);
      data = topCategories.map(item => item.game_count);
    }

    // 生成不同的颜色
    const generateColors = (count) => {
      const baseColors = [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)',
        'rgba(199, 199, 199, 0.6)',
        'rgba(83, 102, 255, 0.6)',
        'rgba(255, 99, 255, 0.6)',
        'rgba(255, 211, 99, 0.6)',
        'rgba(99, 255, 173, 0.6)',
      ];
      
      return Array(count).fill().map((_, i) => baseColors[i % baseColors.length]);
    };
    
    colors = generateColors(labels.length);

    return {
      labels,
      datasets: [
        {
          label: '游戏数量',
          data,
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.6', '1')),
          borderWidth: 1,
        },
      ],
    };
  };

  // 准备游戏增长趋势图表数据
  const getTrendChartData = () => {
    if (!trendData) return null;

    const labels = trendData.map(item => item.date);
    const data = trendData.map(item => item.count);

    return {
      labels,
      datasets: [
        {
          label: '每日新增游戏数',
          data,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const categoryColumns = [
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '游戏数量',
      dataIndex: 'game_count',
      key: 'game_count',
      sorter: (a, b) => a.game_count - b.game_count,
      defaultSortOrder: 'descend',
    },
    {
      title: '占比',
      key: 'percentage',
      render: (_, record) => {
        const percentage = stats ? (record.game_count / stats.total_games * 100).toFixed(2) : '0';
        return (
          <Progress 
            percent={percentage} 
            size="small" 
            status="active" 
            format={percent => `${percent}%`}
          />
        );
      },
    },
  ];

  const barOptions = {
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
        beginAtZero: true,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: '游戏分类占比',
      },
    },
  };

  return (
    <div>
      <TitleText level={4}>平台数据统计</TitleText>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <Select 
          value={selectedPlatform} 
          style={{ width: 120 }} 
          onChange={value => setSelectedPlatform(value)}
        >
          {platforms.map(platform => (
            <Option key={platform} value={platform}>{platform.toUpperCase()}</Option>
          ))}
        </Select>
        
        <Select
          value={timeRange}
          style={{ width: 120 }}
          onChange={value => setTimeRange(value)}
        >
          <Option value={7}>最近 7 天</Option>
          <Option value={30}>最近 30 天</Option>
          <Option value={90}>最近 90 天</Option>
          <Option value={180}>最近 180 天</Option>
        </Select>
      </div>

      <Spin spinning={loading}>
        {stats && (
          <>
            <Row gutter={16}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="总游戏数"
                    value={stats.total_games}
                    prefix={<PlaySquareOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title={`近${timeRange}天新增`}
                    value={stats.new_games}
                    prefix={<PlusOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="游戏分类数"
                    value={stats.categories_count.length}
                    prefix={<AppstoreOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Divider>趋势分析</Divider>

            <Row gutter={16}>
              <Col span={24}>
                <Card>
                  {trendData ? (
                    <Bar options={barOptions} data={getTrendChartData()} />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px' }}>加载中...</div>
                  )}
                </Card>
              </Col>
            </Row>

            <Divider>分类分布</Divider>

            <Row gutter={16}>
              <Col span={12}>
                <Card>
                  {stats.categories_count ? (
                    <Pie options={pieOptions} data={getCategoryData()} />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px' }}>加载中...</div>
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card>
                  <Table 
                    dataSource={stats.categories_count} 
                    columns={categoryColumns}
                    rowKey="category"
                    pagination={{ pageSize: 10 }}
                    size="small"
                  />
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Spin>
    </div>
  );
}

export default PlatformStats; 