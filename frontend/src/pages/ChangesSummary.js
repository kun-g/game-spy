import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Select, 
  Alert, 
  Table, 
  Tag,
  Space
} from 'antd';
import { 
  PlusCircleOutlined, 
  MinusCircleOutlined
} from '@ant-design/icons';
import api from '../services/api';

const { Title } = Typography;
const { Option } = Select;

const ChangesSummary = () => {
  const [platform, setPlatform] = useState('all');
  const [daysFilter, setDaysFilter] = useState(null);
  const [changesData, setChangesData] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取平台列表
  useEffect(() => {
    api.getPlatforms()
      .then(response => {
        setPlatforms(['all', ...response.data]);
      })
      .catch(err => {
        console.error('获取平台列表失败', err);
        setError('获取平台列表失败');
      });
  }, []);

  // 获取变更汇总数据并处理为表格数据
  useEffect(() => {
    setLoading(true);
    
    // 如果选择了"全部"平台，只获取原始数据
    if (platform === 'all') {
      api.getRawChanges(platform)
        .then(response => {
          const rawData = response.data;
          const tableData = [];
          
          // 处理每个原始记录
          rawData.forEach(entry => {
            // 处理添加的URL
            entry.added_urls.forEach(url => {
              tableData.push({
                key: `added-${entry.platform}-${url}`,
                date: entry.date,
                time: entry.time,
                datetime: entry.datetime,
                platform: entry.platform,
                name: getNameFromUrl(url),
                url: url,
                type: url.includes('/game/') ? 'game' : 'other',
                action: 'added',
                count: 1
              });
            });
            
            // 处理删除的URL
            entry.deleted_urls.forEach(url => {
              tableData.push({
                key: `deleted-${entry.platform}-${url}`,
                date: entry.date,
                time: entry.time,
                datetime: entry.datetime,
                platform: entry.platform,
                name: getNameFromUrl(url),
                url: url,
                type: url.includes('/game/') ? 'game' : 'other',
                action: 'deleted',
                count: 1
              });
            });
          });
          
          setChangesData(tableData);
          setLoading(false);
        })
        .catch(err => {
          console.error('获取数据失败', err);
          setError('获取数据失败');
          setLoading(false);
        });
    } else {
      // 选择了特定平台，获取汇总数据和原始数据
      Promise.all([
        api.getChangesSummary(platform, daysFilter),
        api.getRawChanges(platform)
      ])
        .then(([summaryResponse, rawResponse]) => {
          const summaryData = summaryResponse.data;
          const rawData = rawResponse.data;
          
          // 创建URL到日期时间的映射
          const urlDateMap = new Map();
          const urlTimeMap = new Map();
          const urlDatetimeMap = new Map();
          
          rawData.forEach(entry => {
            // 记录添加的URL
            entry.added_urls.forEach(url => {
              urlDateMap.set(url, entry.date);
              urlTimeMap.set(url, entry.time);
              urlDatetimeMap.set(url, entry.datetime);
            });
            
            // 记录删除的URL
            entry.deleted_urls.forEach(url => {
              urlDateMap.set(url, entry.date);
              urlTimeMap.set(url, entry.time);
              urlDatetimeMap.set(url, entry.datetime);
            });
          });
          
          const tableData = [];
          
          // 处理添加的游戏URL
          summaryData.game_urls_added.forEach(item => {
            const url = `https://www.${platform}.com/game/${item.name}`;
            tableData.push({
              key: `added-game-${item.name}`,
              date: urlDateMap.get(url) || '未知',
              time: urlTimeMap.get(url) || '未知',
              datetime: urlDatetimeMap.get(url) || '未知',
              platform: platform,
              name: item.name,
              url: url,
              type: 'game',
              action: 'added',
              count: item.count
            });
          });
          
          // 处理删除的游戏URL
          summaryData.game_urls_deleted.forEach(item => {
            const url = `https://www.${platform}.com/game/${item.name}`;
            tableData.push({
              key: `deleted-game-${item.name}`,
              date: urlDateMap.get(url) || '未知',
              time: urlTimeMap.get(url) || '未知',
              datetime: urlDatetimeMap.get(url) || '未知',
              platform: platform,
              name: item.name,
              url: url,
              type: 'game',
              action: 'deleted',
              count: item.count
            });
          });
          
          // 处理添加的其他URL
          summaryData.other_urls_added.forEach(item => {
            tableData.push({
              key: `added-other-${item.url}`,
              date: urlDateMap.get(item.url) || '未知',
              time: urlTimeMap.get(item.url) || '未知',
              datetime: urlDatetimeMap.get(item.url) || '未知',
              platform: platform,
              name: getNameFromUrl(item.url),
              url: item.url,
              type: 'other',
              action: 'added',
              count: item.count
            });
          });
          
          // 处理删除的其他URL
          summaryData.other_urls_deleted.forEach(item => {
            tableData.push({
              key: `deleted-other-${item.url}`,
              date: urlDateMap.get(item.url) || '未知',
              time: urlTimeMap.get(item.url) || '未知',
              datetime: urlDatetimeMap.get(item.url) || '未知',
              platform: platform,
              name: getNameFromUrl(item.url),
              url: item.url,
              type: 'other',
              action: 'deleted',
              count: item.count
            });
          });
          
          // 按日期时间倒序排序
          tableData.sort((a, b) => b.datetime.localeCompare(a.datetime));
          
          setChangesData(tableData);
          setLoading(false);
        })
        .catch(err => {
          console.error('获取数据失败', err);
          setError('获取数据失败');
          setLoading(false);
        });
    }
  }, [platform, daysFilter]);

  // 从URL提取名称
  const getNameFromUrl = (url) => {
    const parts = url.split('/');
    return parts[parts.length - 1] || url;
  };

  // 表格列定义
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => b.date.localeCompare(a.date),
      defaultSortOrder: 'descend',
      sortDirections: ['descend', 'ascend'],
    },
    platform === 'all' ? {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      filters: platforms.filter(p => p !== 'all').map(p => ({ text: p, value: p })),
      onFilter: (value, record) => record.platform === value,
    } : null,
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <a href={record.url} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: '链接',
      dataIndex: 'url',
      key: 'url',
      render: url => (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      ),
      responsive: ['lg'],
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: type => (
        <Tag color={type === 'game' ? 'blue' : 'purple'}>
          {type === 'game' ? '游戏' : '其他'}
        </Tag>
      ),
      filters: [
        { text: '游戏', value: 'game' },
        { text: '其他', value: 'other' }
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      render: action => (
        <Tag color={action === 'added' ? 'success' : 'error'}>
          {action === 'added' ? (
            <Space>
              <PlusCircleOutlined />
              新增
            </Space>
          ) : (
            <Space>
              <MinusCircleOutlined />
              删除
            </Space>
          )}
        </Tag>
      ),
      filters: [
        { text: '新增', value: 'added' },
        { text: '删除', value: 'deleted' }
      ],
      onFilter: (value, record) => record.action === value,
    },
    {
      title: '次数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a, b) => a.count - b.count,
    }
  ].filter(Boolean);

  // 处理天数筛选变化
  const handleDaysChange = (value) => {
    setDaysFilter(value === 'all' ? null : parseInt(value));
  };

  // 处理平台变化
  const handlePlatformChange = (value) => {
    setPlatform(value);
  };

  if (error) {
    return <Alert type="error" message={error} />;
  }

  return (
    <div className="changes-summary-container">
      <Card title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4}>变更汇总</Title>
          <div>
            <Select
              style={{ width: 150, marginRight: 16 }}
              placeholder="选择平台"
              value={platform}
              onChange={handlePlatformChange}
            >
              {platforms.map(p => (
                <Option key={p} value={p}>{p === 'all' ? '全部' : p}</Option>
              ))}
            </Select>
            <Select
              style={{ width: 150 }}
              placeholder="过滤时间范围"
              defaultValue="all"
              onChange={handleDaysChange}
              disabled={platform === 'all'}
            >
              <Option value="all">全部</Option>
              <Option value="7">最近7天</Option>
              <Option value="30">最近30天</Option>
              <Option value="90">最近90天</Option>
            </Select>
          </div>
        </div>
      }>
        <Table 
          dataSource={changesData.sort((a, b) => b.date.localeCompare(a.date))} 
          columns={columns} 
          loading={loading}
          pagination={{ pageSize: 20 }}
          size="middle"
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
};

export default ChangesSummary; 