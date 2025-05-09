import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Select, 
  Alert, 
  Table, 
  Tag,
  Space,
  Button,
  Tooltip,
  Switch
} from 'antd';
import { 
  PlusCircleOutlined, 
  MinusCircleOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import api from '../services/api';

const { Title } = Typography;
const { Option } = Select;

// Google Trends 地区选项
const geoOptions = [
  { value: 'WORLD', label: '全球' },
  { value: 'US', label: '美国' },
  { value: 'GB', label: '英国' },
  { value: 'JP', label: '日本' },
  { value: 'CN', label: '中国' },
  { value: 'DE', label: '德国' },
  { value: 'FR', label: '法国' },
  { value: 'IN', label: '印度' },
  { value: 'KR', label: '韩国' },
];

// 构建日期范围选项的函数
const buildDateRangeOptions = (useNow = true) => {
  const prefix = useNow ? 'now' : 'today';
  return [
    { label: '近1天', value: `${prefix} 1-d` },
    { label: '近7天', value: `${prefix} 7-d` },
    { label: '近1个月', value: `${prefix} 1-m` },
    { label: '近3个月', value: `${prefix} 3-m` },
    { label: '近1年', value: `${prefix} 12-m` },
    { label: '近5年', value: `${prefix} 5-y` },
    { label: '全部时间', value: 'all' },
  ];
};

const ChangesSummary = () => {
  const [platform, setPlatform] = useState('all');
  const [daysFilter, setDaysFilter] = useState(null);
  const [changesData, setChangesData] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Google Trends 配置
  const [trendGeo, setTrendGeo] = useState('US');
  const [useNowFormat, setUseNowFormat] = useState(true);
  const [dateRangeOptions, setDateRangeOptions] = useState(buildDateRangeOptions(true));
  const [trendDateRange, setTrendDateRange] = useState('now 3-m');

  // 切换时间格式时更新选项和当前值
  useEffect(() => {
    const newOptions = buildDateRangeOptions(useNowFormat);
    setDateRangeOptions(newOptions);
    
    // 更新当前选中的值，保持相同的时间范围但更改前缀
    if (trendDateRange !== 'all') {
      const [_, period] = trendDateRange.split(' ');
      const newPrefix = useNowFormat ? 'now' : 'today';
      setTrendDateRange(period ? `${newPrefix} ${period}` : 'all');
    }
  }, [useNowFormat, trendDateRange]);

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
                name: formatGameName(getNameFromUrl(url)),
                originalName: getNameFromUrl(url),
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
                name: formatGameName(getNameFromUrl(url)),
                originalName: getNameFromUrl(url),
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
            const gameName = item.name;
            const url = `https://www.${platform}.com/game/${gameName}`;
            tableData.push({
              key: `added-game-${gameName}`,
              date: urlDateMap.get(url) || '未知',
              time: urlTimeMap.get(url) || '未知',
              datetime: urlDatetimeMap.get(url) || '未知',
              platform: platform,
              name: formatGameName(gameName),
              originalName: gameName,
              url: url,
              type: 'game',
              action: 'added',
              count: item.count
            });
          });
          
          // 处理删除的游戏URL
          summaryData.game_urls_deleted.forEach(item => {
            const gameName = item.name;
            const url = `https://www.${platform}.com/game/${gameName}`;
            tableData.push({
              key: `deleted-game-${gameName}`,
              date: urlDateMap.get(url) || '未知',
              time: urlTimeMap.get(url) || '未知',
              datetime: urlDatetimeMap.get(url) || '未知',
              platform: platform,
              name: formatGameName(gameName),
              originalName: gameName,
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
              name: formatGameName(getNameFromUrl(item.url)),
              originalName: getNameFromUrl(item.url),
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
              name: formatGameName(getNameFromUrl(item.url)),
              originalName: getNameFromUrl(item.url),
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

  // 格式化游戏名称，将短横线转换为空格并美化显示
  const formatGameName = (name) => {
    if (!name) return '';
    return name.replace(/-/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // 生成Google Trends URL
  const getGoogleTrendsUrl = (keyword) => {
    // 替换空格为加号以优化搜索
    const formattedKeyword = keyword.replace(/ /g, '+');
    
    // 构建基本URL
    let url = `https://trends.google.com/trends/explore?date=${trendDateRange}&q=${formattedKeyword}&hl=zh-CN`;
    
    // 如果不是全球，添加地区参数
    if (trendGeo !== 'WORLD') {
      url += `&geo=${trendGeo}`;
    }
    
    return url;
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
        <Space>
          <a href={record.url} target="_blank" rel="noopener noreferrer">
            {text}
          </a>
          <Tooltip title="查看Google趋势">
            <Button 
              type="text" 
              size="small" 
              icon={<LineChartOutlined />} 
              onClick={() => window.open(getGoogleTrendsUrl(record.name), '_blank')}
            />
          </Tooltip>
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
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

  // 处理Google Trends地区变化
  const handleGeoChange = (value) => {
    setTrendGeo(value);
  };

  // 处理Google Trends时间范围变化
  const handleDateRangeChange = (value) => {
    setTrendDateRange(value);
  };

  // 处理时间格式切换
  const handleFormatToggle = (checked) => {
    setUseNowFormat(checked);
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
              style={{ width: 120, marginRight: 8 }}
              placeholder="选择平台"
              value={platform}
              onChange={handlePlatformChange}
            >
              {platforms.map(p => (
                <Option key={p} value={p}>{p === 'all' ? '全部' : p}</Option>
              ))}
            </Select>
            <Select
              style={{ width: 120, marginRight: 8 }}
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
            <Tooltip title="查看Google趋势的地区">
              <Select
                style={{ width: 100, marginRight: 8 }}
                placeholder="地区"
                value={trendGeo}
                onChange={handleGeoChange}
              >
                {geoOptions.map(option => (
                  <Option key={option.value} value={option.value}>{option.label}</Option>
                ))}
              </Select>
            </Tooltip>
            <Tooltip title="查看Google趋势的时间范围">
              <Select
                style={{ width: 120, marginRight: 8 }}
                placeholder="趋势时间范围"
                value={trendDateRange}
                onChange={handleDateRangeChange}
              >
                {dateRangeOptions.map(option => (
                  <Option key={option.value} value={option.value}>{option.label}</Option>
                ))}
              </Select>
            </Tooltip>
            <Tooltip title="切换时间格式: now/today">
              <Switch
                checkedChildren="now"
                unCheckedChildren="today"
                checked={useNowFormat}
                onChange={handleFormatToggle}
                style={{ marginRight: 8 }}
              />
            </Tooltip>
          </div>
        </div>
      }>
        <Table 
          dataSource={changesData} 
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