import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Select, Typography, Tag, Badge, Spin } from 'antd';
import { Link } from 'react-router-dom';
import { LikeOutlined, DislikeOutlined, TrophyOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title } = Typography;
const { Option } = Select;

function Rankings() {
  const [loading, setLoading] = useState(false);
  const [rankings, setRankings] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState('poki');
  const [limitSize, setLimitSize] = useState(20);

  useEffect(() => {
    loadPlatforms();
  }, []);

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

  const loadRankings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getRankings(selectedPlatform, limitSize);
      setRankings(response.data);
      setLoading(false);
    } catch (error) {
      console.error("获取排行榜数据失败", error);
      setLoading(false);
    }
  }, [selectedPlatform, limitSize]);

  useEffect(() => {
    if (selectedPlatform) {
      loadRankings();
    }
  }, [selectedPlatform, limitSize, loadRankings]);

  const handlePlatformChange = (value) => {
    setSelectedPlatform(value);
  };

  const handleLimitChange = (value) => {
    setLimitSize(value);
  };

  const columns = [
    {
      title: '排名',
      key: 'rank',
      width: 80,
      render: (_, __, index) => {
        let icon = null;
        if (index === 0) {
          icon = <TrophyOutlined style={{ color: '#FFD700' }} />;  // 金牌
        } else if (index === 1) {
          icon = <TrophyOutlined style={{ color: '#C0C0C0' }} />;  // 银牌
        } else if (index === 2) {
          icon = <TrophyOutlined style={{ color: '#CD7F32' }} />;  // 铜牌
        }
        
        return (
          <span>
            {icon && <span style={{ marginRight: 8 }}>{icon}</span>}
            <Badge count={index + 1} style={{ backgroundColor: index < 3 ? '#1890ff' : '#8c8c8c' }} />
          </span>
        );
      },
    },
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
      render: (text) => (
        <span><LikeOutlined style={{ color: '#52c41a' }} /> {text}</span>
      ),
      sorter: (a, b) => a.up_count - b.up_count,
    },
    {
      title: '差评',
      dataIndex: 'down_count',
      key: 'down_count',
      render: (text) => (
        <span><DislikeOutlined style={{ color: '#f5222d' }} /> {text}</span>
      ),
      sorter: (a, b) => a.down_count - b.down_count,
    },
    {
      title: '好评率',
      dataIndex: 'positive_ratio',
      key: 'positive_ratio',
      render: (text) => {
        const percentage = (text * 100).toFixed(2);
        let color = 'green';
        if (percentage < 50) {
          color = 'red';
        } else if (percentage < 70) {
          color = 'orange';
        }
        return <Tag color={color}>{percentage}%</Tag>;
      },
      sorter: (a, b) => a.positive_ratio - b.positive_ratio,
      defaultSortOrder: 'descend',
    },
  ];

  return (
    <div>
      <Title level={4}>游戏好评排行榜</Title>
      
      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <Select 
          value={selectedPlatform} 
          style={{ width: 120 }} 
          onChange={handlePlatformChange}
        >
          {platforms.map(platform => (
            <Option key={platform} value={platform}>{platform.toUpperCase()}</Option>
          ))}
        </Select>
        
        <Select
          value={limitSize}
          style={{ width: 120 }}
          onChange={handleLimitChange}
        >
          <Option value={10}>TOP 10</Option>
          <Option value={20}>TOP 20</Option>
          <Option value={50}>TOP 50</Option>
          <Option value={100}>TOP 100</Option>
        </Select>
      </div>
      
      <Card>
        <Spin spinning={loading}>
          <Table 
            dataSource={rankings} 
            columns={columns} 
            rowKey="id"
            pagination={false}
          />
        </Spin>
      </Card>
    </div>
  );
}

export default Rankings; 