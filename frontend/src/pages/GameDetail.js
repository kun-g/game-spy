import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Row, Col, Typography, Tag, Spin, Button, Divider, Descriptions } from 'antd';
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
import { 
  LikeOutlined, 
  DislikeOutlined, 
  ArrowLeftOutlined, 
  TagOutlined, 
  LinkOutlined 
} from '@ant-design/icons';
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

const { Title: TitleText, Paragraph } = Typography;

function GameDetail() {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (gameId) {
      loadGameDetail();
    }
  }, [gameId, loadGameDetail]);

  const loadGameDetail = async () => {
    setLoading(true);
    try {
      const response = await api.getGameDetail(gameId);
      setGame(response.data);
    } catch (error) {
      console.error('加载游戏详情失败', error);
    } finally {
      setLoading(false);
    }
  };

  // 格式化评分历史数据为图表数据
  const formatRatingHistory = () => {
    if (!game || !game.rating_history || game.rating_history.length === 0) {
      return null;
    }

    const history = [...game.rating_history].sort((a, b) => 
      new Date(a.fetch_time) - new Date(b.fetch_time)
    );
    
    const labels = history.map(item => {
      const date = new Date(item.fetch_time);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    
    const upData = history.map(item => item.up_count);
    const downData = history.map(item => item.down_count);
    
    return {
      labels,
      datasets: [
        {
          label: '好评数',
          data: upData,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: false,
        },
        {
          label: '差评数',
          data: downData,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: false,
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
        text: '评分历史趋势',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  if (loading) {
    return <Spin size="large" />;
  }

  if (!game) {
    return (
      <div>
        <TitleText level={4}>游戏不存在</TitleText>
        <Button type="primary" icon={<ArrowLeftOutlined />}>
          <Link to="/games">返回游戏列表</Link>
        </Button>
      </div>
    );
  }

  // 计算好评率
  const totalRatings = game.up_count + game.down_count;
  const positiveRatio = totalRatings > 0 
    ? (game.up_count / totalRatings * 100).toFixed(2) 
    : '0.00';

  return (
    <div>
      <Button 
        type="primary" 
        icon={<ArrowLeftOutlined />} 
        style={{ marginBottom: 16 }}
      >
        <Link to="/games">返回游戏列表</Link>
      </Button>
      
      <Card>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <TitleText level={2}>{game.title}</TitleText>
            <div style={{ marginTop: 8 }}>
              {game.categories && game.categories.map(category => (
                <Tag color="blue" key={category}>
                  <TagOutlined /> {category}
                </Tag>
              ))}
              <Button 
                type="link" 
                icon={<LinkOutlined />} 
                href={game.url} 
                target="_blank"
              >
                在Poki查看
              </Button>
            </div>
          </Col>
          
          <Col span={24}>
            <Divider orientation="left">游戏简介</Divider>
            <Paragraph>{game.description || '暂无简介'}</Paragraph>
          </Col>
          
          <Col span={24}>
            <Divider orientation="left">评分数据</Divider>
            <Descriptions bordered>
              <Descriptions.Item label="好评数">
                <LikeOutlined style={{ color: '#52c41a' }} /> {game.up_count}
              </Descriptions.Item>
              <Descriptions.Item label="差评数">
                <DislikeOutlined style={{ color: '#f5222d' }} /> {game.down_count}
              </Descriptions.Item>
              <Descriptions.Item label="好评率">
                {positiveRatio}%
              </Descriptions.Item>
            </Descriptions>
          </Col>
          
          {game.related_categories && game.related_categories.length > 0 && (
            <Col span={24}>
              <Divider orientation="left">相关分类</Divider>
              <div>
                {game.related_categories.map(category => (
                  <Tag color="purple" key={category}>
                    {category}
                  </Tag>
                ))}
              </div>
            </Col>
          )}
          
          {game.rating_history && game.rating_history.length > 1 && (
            <Col span={24}>
              <Divider orientation="left">评分趋势</Divider>
              <Line options={chartOptions} data={formatRatingHistory()} />
            </Col>
          )}
        </Row>
      </Card>
    </div>
  );
}

export default GameDetail; 