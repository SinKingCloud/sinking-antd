// noinspection TypeScriptValidateTypes,JSAnnotator

import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState} from "react";
import {createStyles} from "antd-style";
import {
    App,
    message as antdMessage,
    Button,
    Card,
    Col,
    Form,
    Input,
    Pagination,
    PaginationProps,
    TableProps,
    TableColumnProps,
    FormInstance,
    Row,
    Space,
    Table,
    Affix,
    Select,
    DatePicker,
    TimePicker,
    InputNumber,
    Rate,
    Progress,
    Switch,
    Tag,
    Tooltip, Typography
} from "antd";
import {DownOutlined, RedoOutlined, UpOutlined, QuestionCircleOutlined} from "@ant-design/icons";
import dayjs from 'dayjs';

/**
 * ProTable 列配置接口
 * 扩展自 Ant Design 的 TableColumnProps，添加了更多功能
 */
export interface ProColumns<T = any> extends TableColumnProps<T> {
    hideInSearch?: boolean; // 是否在搜索表单中隐藏该列
    hideInTable?: boolean; // 是否在表格中隐藏该列
    valueType?: 'text' | 'time' | 'date' | 'dateTime' | 'dateRange' | 'dateTimeRange' | 'timeRange' | 'rate' | 'digit' | 'progress' | 'percent' | 'switch' | 'select'; // 列的值类型（决定渲染和表单组件）
    copyable?: boolean; // 是否可复制（显示复制图标）
    tip?: string; // 列标题的提示信息
    valueEnum?: Record<string, { text: string; color?: string }>; // 枚举值映射（用于 select 类型）
    transform?: (value: any) => any; // 搜索值转换函数（提交前转换表单值）
    fieldProps?: any; // 表单项的属性（传递给表单组件）
    formItemProps?: any; // Form.Item 的属性
    props?: any; // 传递给渲染组件的额外属性
}

/**
 * ProTable 搜索表单配置接口
 */
export interface ProTableSearch<T = any> {
    layout?: "horizontal" | "vertical"; // 搜索表单布局方式（默认 "horizontal"）
}

/**
 * ProTable 组件属性
 */
export type ProTableProps = {
    title?: any; // 表格标题
    extra?: any; // 表格额外操作区域（显示在标题右侧）
    extraRefreshBtn?: boolean; // 是否显示刷新按钮（默认 true）
    rowKey?: string; // 表格行的唯一标识字段名（默认 "id"）
    columns?: ProColumns[]; // 列配置数组
    tableProps?: TableProps<any> & undefined; // Ant Design Table 原生属性
    search?: ProTableSearch | boolean; // 搜索表单配置（false 表示禁用搜索）
    pageHidden?: boolean; // 是否隐藏分页（默认 false）
    pageInTable?: boolean; // 是否在表格内显示分页（默认 false，在表格外显示）
    paginationProps?: PaginationProps; // Ant Design Pagination 原生属性
    defaultPage?: number; // 默认页码（默认 1）
    defaultPageSize?: number; // 默认每页条数（默认 10）
    request?: (params: any, sort: any) => Promise<any>; // 数据请求函数（必须返回 Promise）
    virtual?: boolean; // 是否启用虚拟滚动（大数据量时推荐开启）
    // 多选配置
    rowSelection?: {
        selectedRowKeys?: React.Key[]; // 选中的行 key 数组
        onChange?: (selectedRowKeys: React.Key[], selectedRows: any[]) => void; // 选择变化时的回调
        onSelect?: (record: any, selected: boolean, selectedRows: any[]) => void; // 选择单行时的回调
        onSelectAll?: (selected: boolean, selectedRows: any[], changeRows: any[]) => void; // 全选时的回调
        onSelectInvert?: (selectedRowKeys: React.Key[]) => void; // 反选时的回调
        align?: string; // 选择列对齐方式
        columnWidth?: number; // 选择列宽度
        fixed?: boolean; // 是否固定选择列在左侧
        leftExtra?: any; // 选择操作栏左侧额外内容
        rightExtra?: any; // 选择操作栏右侧额外内容
        hideExtra?: boolean; // 是否隐藏选择操作栏
    } | false | true; // 多选配置（true 表示启用默认配置，false 表示禁用）
    // 固钉配置
    selectionAffix?: boolean; // 是否固定多选操作栏（滚动时悬浮）
    paginationAffix?: boolean; // 是否固定底部分页栏（滚动时悬浮）
};

/**
 * ProTable 组件引用接口
 * 用于父组件通过 ref 调用表格的方法
 */
export interface ProTableRef {
    searchForm: FormInstance | any; // 搜索表单实例（可用于获取/设置表单值）
    refreshTableData: () => void | any; // 刷新表格数据（保持当前页码和搜索条件）
    resetTableData: () => void | any; // 重置表格数据（重置到第一页和默认搜索条件）
    getTableData: () => any; // 获取当前表格数据
    getSelectedRowKeys: () => React.Key[]; // 获取选中的行 keys
    getSelectedRows: () => any[]; // 获取选中的行数据
    setSelectedRowKeys: (keys: React.Key[]) => void; // 设置选中的行 keys
    clearSelectedRows: () => void; // 清空所有选中行
    invertSelectedRow: () => void; // 反选选中行
    allSelectedRow: () => void; // 全选所有行
}

/**
 * 样式配置
 */
const useStyles: any = createStyles(({token, isDarkMode}: any): any => {
    const fontColor = isDarkMode ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.65)";
    const backgroundColor = isDarkMode ? "rgba(255, 255, 255, 0.1) !important" : "rgba(0, 0, 0, 0.05) !important";
    const fontSize = 12;
    const tableBorder = `${token?.lineWidth}px ${token?.lineType} ${token?.colorBorderSecondary}`;
    const tableRadius = token?.borderRadius + "px !important";
    const pagination = {
        color: fontColor,
        fontSize: fontSize,
        ".ant-pagination-item-active": {
            backgroundColor: "transparent !important"
        },
        ".ant-pagination-item": {
            backgroundColor: "transparent !important",
            "a": {
                color: fontColor,
            }
        },
        ".ant-pagination-options": {
            display: "block",
            ".ant-select": {
                lineHeight: "calc(var(--ant-pagination-item-size-actual) - 2px)",
                height: "var(--ant-pagination-item-size-actual)",
                ".ant-select-content": {
                    fontSize: fontSize,
                    transition: "background-color 0.3s ease",
                    color: fontColor,
                    borderColor: "transparent !important",
                    borderRadius: token?.borderRadius + "px !important",
                },
            },
            ".ant-pagination-options-quick-jumper": {
                "input": {
                    fontSize: fontSize,
                    color: fontColor,
                    borderColor: "transparent",
                    borderRadius: token?.borderRadius + "px !important",
                    backgroundColor: backgroundColor,
                },
            }
        },
    }
    const btn = {
        fontSize: fontSize + "px",
        height: "auto",
        padding: "5px 10px",
        borderRadius: token?.borderRadius + "px",
    }
    return {
        formItem: {
            marginBottom: "0 !important",
        },
        formItemLabel: {
            ".ant-form-item-label": {
                flex: "0 0 80px",
            }
        },
        formItemBtn: {
            ".ant-space-item>div": {
                display: "flex",
                alignItems: "center",
                gap: "8px",
            },
            ".ant-space-item>a": {
                textDecoration: "none",
            },
        },
        formButton: {
            display: "flex",
            justifyContent: "end",
            alignItems: "end",
        },
        filter: {
            boxShadow: "0 0px 10px 4px rgba(0, 0, 0, 0.05) !important",
            backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(8px)",
        },
        pageCard: {
            ".ant-card-body": {
                padding: 15,
            },
            ".ant-pagination ": pagination,
        },
        toolCard: {
            fontSize: token?.fontSizeSM,
            color: fontColor,
            ".ant-card-body": {
                padding: "12px 17px",
                ".ant-col": {
                    fontSize: fontSize,
                    "a": {
                        opacity: isDarkMode ? "1" : "0.8"
                    }
                }
            },
            "button": btn
        },
        tableCard: {
            ".ant-card-head": {
                padding: "10px 15px 0 15px",
                minHeight: "42px",
                borderBottom: "none",
                ".ant-card-extra": {
                    "button": btn,
                }
            },
            ".ant-card-body": {
                padding: "10px"
            }
        },
        table: {
            ".ant-table": {
                borderRadius: tableRadius,
            },
            ".ant-table:not(.ant-table-bordered) > .ant-table-container": {
                borderInline: tableBorder,
            },
            ".ant-table-container, .ant-table-content": {
                borderRadius: tableRadius,
            },
            ".ant-table-thead": {
                ".ant-table-cell": {
                    padding: "10px !important",
                    fontSize: token?.fontSize,
                    color: fontColor
                },
            },
            ".ant-table-tbody": {
                ".ant-table-cell": {
                    padding: "10px !important",
                    fontSize: token?.fontSizeSM + 1,
                    color: fontColor,
                    ".ant-btn": {
                        height: "25px",
                        padding: "10px ",
                        fontSize: token?.fontSizeSM,
                    }
                },
                ".ant-typography": {
                    fontSize: token?.fontSizeSM + 1,
                    color: fontColor
                },
            },
            ".ant-pagination ": {
                ...pagination, ...{
                    margin: "15px 15px 5px 15px !important"
                }
            },
        }
    };
});

const useContainerResponsive = (containerRef: React.RefObject<HTMLDivElement | null>) => {
    const [breakpoint, setBreakpoint] = useState<number | null>(null);
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const getBreakpoint = (width: number) => width < 576 ? 0 : width < 768 ? 1 : width < 992 ? 2 : 3;
        let currentBreakpoint = getBreakpoint(container.clientWidth);
        let timeout: ReturnType<typeof setTimeout> | undefined;
        setBreakpoint(currentBreakpoint);

        const handleResize = () => {
            const nextBreakpoint = getBreakpoint(container.clientWidth);
            clearTimeout(timeout);
            // 同一断点内的尺寸变化无需进入 React 更新队列。
            if (nextBreakpoint === currentBreakpoint) return;
            timeout = setTimeout(() => {
                currentBreakpoint = nextBreakpoint;
                setBreakpoint(nextBreakpoint);
            }, 10);
        };
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(container);

        return () => {
            clearTimeout(timeout);
            resizeObserver.disconnect();
        };
    }, [containerRef]);

    return useMemo(() => ({
        xs: breakpoint === 0,
        sm: breakpoint === 1,
        md: breakpoint === 2,
        lg: breakpoint === 3,
        xl: breakpoint === 4,
        xxl: breakpoint === 5,
        mobile: breakpoint !== null && breakpoint < 3
    }), [breakpoint]);
};

// 搜索折叠与固钉状态仅更新各自区域，避免让表格重新渲染。
const SearchForm = React.memo(({renderItems, ...formProps}: React.ComponentProps<typeof Form> & {
    renderItems: (collapsed: boolean, setCollapsed: React.Dispatch<React.SetStateAction<boolean>>) => React.ReactNode;
}) => {
    const [collapsed, setCollapsed] = useState(true);
    return <Form {...formProps}>{renderItems(collapsed, setCollapsed)}</Form>;
});

const AffixCard = ({affix, filterClassName, offsetTop, offsetBottom, className, ...cardProps}: React.ComponentProps<typeof Card> & {
    affix: boolean;
    filterClassName: string;
    offsetTop?: number;
    offsetBottom?: number;
}) => {
    const [affixed, setAffixed] = useState(false);
    const onAffixChange = useCallback((value?: boolean) => setAffixed(value || false), []);
    const content = <Card {...cardProps} className={className + (affixed ? " " + filterClassName : "")}/>;
    return affix ? <Affix offsetTop={offsetTop} offsetBottom={offsetBottom} onChange={onAffixChange}>{content}</Affix> : content;
};

const ProTableContent = ({ownerProps: props, tableRef: ref, styles}: {
    ownerProps: ProTableProps;
    tableRef: React.ForwardedRef<ProTableRef>;
    styles: ReturnType<typeof useStyles>["styles"];
}) => {
    const app = App.useApp();
    const message = typeof app.message?.error === "function" ? app.message : antdMessage;
    const defaults = useMemo(() => ({
        columns: [] as ProColumns[],
        tableProps: {} as TableProps<any>,
        paginationProps: {} as PaginationProps,
        search: {} as ProTableSearch,
    }), []);

    const containerRef = useRef<HTMLDivElement>(null);
    const device = useContainerResponsive(containerRef);
    const requestRef = useRef<any>(null);
    const requestVersion = useRef(0);
    const {
        title = undefined, // 表格标题
        extra = undefined, // 表格额外内容
        extraRefreshBtn, // 是否显示刷新按钮
        rowKey = "id", // 行的唯一标识
        columns = defaults.columns, // 列配置
        tableProps = defaults.tableProps, // 表格属性
        pageHidden = false, // 是否隐藏分页
        pageInTable = false, // 是否在表格中显示分页
        paginationProps = defaults.paginationProps, // 分页属性
        defaultPage = 1,//默认分页
        defaultPageSize = 10,//默认分页容量
        search = defaults.search as any, // 搜索表单配置
        request = undefined, // 请求函数
        rowSelection = false as any, // 多选配置
        selectionAffix = false, // 是否固定多选操作栏
        paginationAffix = false, // 是否固定底部分页栏
        virtual = false, // 是否启用虚拟滚动
    } = props;

    const [form] = Form.useForm();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [params, setParams] = useState({});
    const [sort, setSort] = useState({});
    const [page, setPage] = useState(defaultPage);
    const [pageSize, setPageSize] = useState(defaultPageSize);
    const [total, setTotal] = useState(0);

    const formatValues = useCallback((values: any) => {
        const transformedValues: any = {...values};
        Object.keys(transformedValues).forEach((key) => {
            if (!transformedValues[key]) {
                delete transformedValues[key]
            }
        });
        columns.forEach((column: ProColumns) => {
            const {dataIndex, transform, valueType} = column;
            const value = values[dataIndex as string];
            if (value !== undefined && value !== null && value !== '') {
                if (transform) {
                    const transformed = transform?.(value);
                    if (typeof transformed === 'object' && transformed !== null) {
                        Object.assign(transformedValues, transformed);
                        delete transformedValues[column?.dataIndex]
                    } else {
                        transformedValues[dataIndex as string] = transformed;
                    }
                } else {
                    // 根据 valueType 进行默认转换
                    switch (valueType) {
                        case 'dateRange':
                        case 'dateTimeRange':
                        case 'timeRange':
                            if (Array.isArray(value) && value.length === 2) {
                                // 统一使用 YYYY-MM-DD HH:mm:ss 格式
                                const formatStr = 'YYYY-MM-DD HH:mm:ss';
                                transformedValues[`${dataIndex}_start`] = value[0]?.format ? value[0].format(formatStr) : value[0];
                                transformedValues[`${dataIndex}_end`] = value[1]?.format ? value[1].format(formatStr) : value[1];
                            }
                            break;
                        case 'date':
                            // 日期类型也使用完整的时间格式，时分秒为 00:00:00
                            transformedValues[dataIndex as string] = value?.format ? value.format('YYYY-MM-DD 00:00:00') : value;
                            break;
                        case 'dateTime':
                            transformedValues[dataIndex as string] = value?.format ? value.format('YYYY-MM-DD HH:mm:ss') : value;
                            break;
                        case 'time':
                            // 时间类型使用当天日期 + 时间
                            if (value?.format) {
                                const today = dayjs().format('YYYY-MM-DD');
                                transformedValues[dataIndex as string] = `${today} ${value.format('HH:mm:ss')}`;
                            } else {
                                transformedValues[dataIndex as string] = value;
                            }
                            break;
                        case 'switch':
                            // Switch 组件返回 boolean，可能需要转换为 0/1
                            transformedValues[dataIndex as string] = value;
                            break;
                        default:
                            transformedValues[dataIndex as string] = value;
                    }
                }
            } else if (value === false && valueType === 'switch') {
                // 特殊处理 switch 类型的 false 值
                if (transform) {
                    const transformed = transform(value);
                    if (typeof transformed === 'object' && transformed !== null) {
                        Object.assign(transformedValues, transformed);
                    } else {
                        transformedValues[dataIndex as string] = transformed;
                    }
                } else {
                    transformedValues[dataIndex as string] = value;
                }
            }
        });
        return transformedValues;
    }, [columns]);

    const onFinish = useCallback((values: any) => {
        setPage(1);
        setParams(formatValues(values));
    }, [formatValues]);

    const onReset = useCallback(() => {
        if ((params && Object.keys(params).length > 0) || page > 1) {
            form?.resetFields();
            setPage(1);
            setParams({});
        }
    }, [params, page, form]);

    const getSearchFormItem = useCallback((collapsed: boolean, setCollapsed: React.Dispatch<React.SetStateAction<boolean>>) => {
        let elements: any[] = [];
        let sum = 0;
        let sumAll = 0;
        let skip = 1;
        let span = 24;
        if (device.xl || device.xxl || device.lg) {
            skip = 3;
            span = 6;
        } else if (device.md) {
            skip = 2;
            span = 8;
        } else if (device.sm) {
            skip = 1;
            span = 12;
        }
        // 根据 valueType 渲染不同的表单组件
        const renderFormField = (column: ProColumns) => {
            const {valueType, valueEnum, dataIndex, title, props = {}} = column;
            const placeholder = `请输入${title || dataIndex}`;

            // 如果有枚举值，渲染 Select
            if (valueEnum) {
                return (
                    <Select placeholder={`请选择${title || dataIndex}`} allowClear {...props}>
                        {Object.entries(valueEnum).map(([key, value]) => (
                            <Select.Option key={key} value={key}>
                                {value.text}
                            </Select.Option>
                        ))}
                    </Select>
                );
            }
            switch (valueType) {
                case 'date':
                    return <DatePicker style={{width: '100%'}} placeholder={placeholder} {...props} />;
                case 'dateTime':
                    return <DatePicker showTime style={{width: '100%'}} placeholder={placeholder} {...props} />;
                case 'dateRange':
                    return <DatePicker.RangePicker style={{width: '100%'}} {...props} />;
                case 'dateTimeRange':
                    return <DatePicker.RangePicker showTime style={{width: '100%'}} {...props} />;
                case 'time':
                    return <TimePicker style={{width: '100%'}} placeholder={placeholder} {...props} />;
                case 'timeRange':
                    return <TimePicker.RangePicker style={{width: '100%'}} {...props} />;
                case 'digit':
                    return <InputNumber style={{width: '100%'}} placeholder={placeholder} {...props} />;
                case 'rate':
                    return <Rate allowHalf {...props} />;
                case 'switch':
                    return <Switch {...props} />;
                case 'percent':
                    return (
                        <InputNumber
                            style={{width: '100%'}}
                            placeholder={placeholder}
                            formatter={value => `${value}%`}
                            parser={value => value!.replace('%', '')}
                            {...props}
                        />
                    );
                case 'progress':
                    return (
                        <InputNumber
                            style={{width: '100%'}}
                            placeholder={placeholder}
                            min={0}
                            max={100}
                            {...props}
                        />
                    );
                case 'select':
                    return <Select placeholder={`请选择${title || dataIndex}`} allowClear {...props} />;
                default:
                    return <Input placeholder={placeholder} {...props} />;
            }
        };
        let hide = false;
        columns.forEach((column: ProColumns, index) => {
            if (column?.hideInSearch === true) {
                return;
            }
            if (!hide) {
                sumAll++;
            }
            if (skip > 0 && collapsed && sum >= skip) {
                hide = true
            }
            if (!hide) {
                sum++;
            }
            const {formItemProps = {}} = column;
            elements.push(<Col span={span} style={{display: hide ? "none" : "block"}} key={column?.dataIndex + index}
                               className={search?.layout && search?.layout != "vertical" ? " " + styles.formItemLabel : ""}>
                <Form.Item
                    className={styles.formItem}
                    label={column?.title || column?.dataIndex}
                    labelAlign={"right"}
                    colon={true}
                    tooltip={column?.tip || undefined}
                    name={column?.dataIndex}
                    {...formItemProps}>
                    {renderFormField(column)}
                </Form.Item>
            </Col>)
        })
        let offset = 0;
        if (device.xl || device.xxl || device.lg) {
            if (sum <= 3) {
                offset = (4 - sum - 1) * 6;
            } else {
                offset = sum % 4;
                if (offset <= 0) {
                    offset = 18
                } else {
                    offset = 24 - (offset + 1) * 6;
                }
            }
        } else if (device.md) {
            if (sum <= 2) {
                offset = (3 - sum - 1) * 8;
            } else {
                offset = sum % 3;
                if (offset <= 0) {
                    offset = 16
                } else {
                    offset = 24 - (offset + 1) * 8;
                }
            }
        } else if (device.sm) {
            if (sum <= 1) {
                offset = (2 - sum - 1) * 12;
            } else {
                offset = sum % 2;
                if (offset <= 0) {
                    offset = 12
                } else {
                    offset = 24 - (offset + 1) * 12;
                }
            }
        } else if (device.xs) {
            offset = 0
        }
        if (offset <= 0) {
            offset = 0
        }
        elements.push(<Col span={span} key={"action" + (sum + 2)} offset={offset}
                           className={styles.formButton}>
            <Form.Item className={styles.formItem}>
                <Space align={"center"} size={16} className={styles.formItemBtn}>
                    <div>
                        <Button htmlType="reset">
                            重置
                        </Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            查询
                        </Button>
                    </div>
                    {sumAll > skip &&
                        <a onClick={() => setCollapsed(!collapsed)}>
                            {collapsed ? <>展开 <DownOutlined/></> : <>收起 <UpOutlined/></>}
                        </a>}
                </Space>
            </Form.Item>
        </Col>)
        return <Row gutter={[20, 20]}>
            {elements}
        </Row>;
    }, [columns, device, loading, search, styles, props]);

    // 使用 useCallback 缓存 renderTableCell 函数
    const renderTableCell = useCallback((text: any, record: any, column: ProColumns) => {
        const {valueType, valueEnum, copyable, props = {}} = column;
        if (valueEnum && text !== undefined && text !== null) {
            const enumItem = valueEnum[text];
            if (enumItem) {
                const {text: label, color} = enumItem;
                if (color) {
                    const colorMap: Record<string, string> = {
                        success: 'success',
                        warning: 'warning',
                        error: 'error',
                        default: 'default',
                        processing: 'processing'
                    };
                    return <Tag color={colorMap[color] || color || "default"}
                                variant={"filled"} {...props}>{label}</Tag>;
                }
                return label;
            }
        }
        let content: React.ReactNode;
        switch (valueType) {
            case 'date':
                content = text ? dayjs(text).format('YYYY-MM-DD') : '-';
                break;
            case 'dateTime':
                content = text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-';
                break;
            case 'time':
                content = text ? dayjs(text).format('HH:mm:ss') : '-';
                break;
            case 'percent':
                content = <Progress percent={Number(text) || 0} size="small" {...props} />;
                break;
            case 'progress':
                content = <Progress percent={Number(text) || 0} size="small" {...props} />;
                break;
            case 'rate':
                content = <Rate disabled value={Number(text) || 0} {...props} />;
                break;
            case 'switch':
                content = <Switch checked={!!text} disabled {...props} />;
                break;
            case 'digit':
                content = typeof text === 'number' ? text.toLocaleString() : text;
                break;
            default:
                content = text || '-';
        }
        if (copyable && text) {
            return <Typography.Text copyable>
                {content}
            </Typography.Text>;
        }
        return content;
    }, []);

    const getTableColumns = useMemo(() => {
        const list: any[] = [];
        columns.forEach((column: ProColumns) => {
            if (column?.hideInTable === true) return;
            const newColumn: ProColumns = {
                ...column,
                // 使用稳定的 render 函数引用
                render: column.render || ((text: any, record: any) => {
                    return renderTableCell(text, record, column);
                })
            };
            if (column.tip && typeof column.title === 'string') {
                const originalTitle = column.title;
                newColumn.title = () => (
                    <Space size={"small"}>
                        {originalTitle}
                        <Tooltip title={column.tip}>
                            <QuestionCircleOutlined/>
                        </Tooltip>
                    </Space>
                );
            }
            list.push(newColumn);
        });
        return list;
    }, [columns, renderTableCell]);

    requestRef.current = request;
    const hasRequest = Boolean(request);

    const requestData = useCallback(() => {
        const version = ++requestVersion.current;
        const currentRequest = requestRef.current;
        if (!currentRequest) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const param: any = {...params};
        param.current = page;
        param.pageSize = pageSize;
        const sorter = {...sort};
        void (async () => {
            try {
                const res = await currentRequest(param, sorter);
                if (version !== requestVersion.current) return;
                if (res?.success) {
                    setData(res?.data || []);
                    setTotal(res?.total || 0);
                }
            } catch (reason) {
                if (version !== requestVersion.current) return;
                const error = reason instanceof Error ? reason : new Error("获取列表失败");
                message.error(error.message);
            } finally {
                if (version === requestVersion.current) setLoading(false);
            }
        })();
    }, [params, page, pageSize, sort, message]);

    useEffect(() => {
        requestData();
        return () => { requestVersion.current += 1; };
    }, [requestData, hasRequest]);

    const getTableExtra = useMemo(() => {
        if (!extraRefreshBtn && !extra) {
            return false;
        }
        return <Space>
            {extra}
            {extraRefreshBtn &&
                <Button color="default" style={{
                    fontSize: "15px",
                    opacity: "0.7",
                }} variant="link"
                        icon={<RedoOutlined rotate={260}/>}
                        onClick={requestData}/>}
        </Space>
    }, [extraRefreshBtn, extra, requestData]);

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [selectedRows, setSelectedRows] = useState<any[]>([]);

    const clearSelectedRow = useCallback(() => {
        setSelectedRowKeys([]);
        setSelectedRows([]);
        if (rowSelection && typeof rowSelection === 'object' && rowSelection.onChange) {
            rowSelection.onChange([], []);
        }
    }, [rowSelection]);

    const invertSelectedRow = useCallback(() => {
        const selectedKeys = new Set(selectedRowKeys);
        const newSelectedRows = data.filter(item => !selectedKeys.has(item[rowKey]));
        const newSelectedKeys = newSelectedRows.map(item => item[rowKey]);
        setSelectedRowKeys(newSelectedKeys);
        setSelectedRows(newSelectedRows);
        if (rowSelection && typeof rowSelection === 'object' && rowSelection.onChange) {
            rowSelection.onChange(newSelectedKeys, newSelectedRows);
        }
    }, [data, rowKey, selectedRowKeys, rowSelection]);

    const allSelectedRow = useCallback(() => {
        const allKeys = data.map(item => item[rowKey]);
        setSelectedRowKeys(allKeys);
        setSelectedRows(data);
        if (rowSelection && typeof rowSelection === 'object' && rowSelection.onChange) {
            rowSelection.onChange(allKeys, data);
        }
    }, [data, rowKey, rowSelection]);

    const handleSelectChange = useCallback((newSelectedRowKeys: React.Key[], newSelectedRows: any[]) => {
        setSelectedRowKeys(newSelectedRowKeys);
        setSelectedRows(newSelectedRows);
        if (rowSelection && typeof rowSelection === 'object' && rowSelection?.onChange) {
            rowSelection?.onChange(newSelectedRowKeys, newSelectedRows);
        }
    }, [rowSelection]);

    const handleSelect = useCallback((record: any, selected: boolean, selectedRows: any[]) => {
        if (rowSelection && typeof rowSelection === 'object' && rowSelection?.onSelect) {
            rowSelection?.onSelect(record, selected, selectedRows);
        }
    }, [rowSelection]);

    const handleSelectAll = useCallback((selected: boolean, selectedRows: any[], changeRows: any[]) => {
        if (rowSelection && typeof rowSelection === 'object' && rowSelection?.onSelectAll) {
            rowSelection?.onSelectAll(selected, selectedRows, changeRows);
        }
    }, [rowSelection]);

    const handleSelectInvert = useCallback((selectedRowKeys: React.Key[]) => {
        if (rowSelection && typeof rowSelection === 'object' && rowSelection?.onSelectInvert) {
            rowSelection?.onSelectInvert(selectedRowKeys);
        }
    }, [rowSelection]);

    const getRowSelection = useMemo((): any => {
        if (rowSelection === false) {
            return undefined;
        }
        const select = {
            selectedRowKeys: rowSelection?.selectedRowKeys || selectedRowKeys,
            onChange: handleSelectChange,
            onSelect: handleSelect,
            onSelectAll: handleSelectAll,
            onSelectInvert: handleSelectInvert,
        }
        return {
            ...{
                align: rowSelection?.align || "center",
                columnWidth: rowSelection?.columnWidth || 50,
                fixed: rowSelection?.fixed || false,
                selections: [
                    {
                        key: 'all',
                        text: '全部选中',
                        onSelect: allSelectedRow
                    },
                    {
                        key: 'invert',
                        text: '反向选中',
                        onSelect: invertSelectedRow
                    },
                    {
                        key: 'clear',
                        text: '清空选中',
                        onSelect: clearSelectedRow
                    }
                ]
            }, ...rowSelection, ...select
        }
    }, [rowSelection, selectedRowKeys, handleSelectChange, handleSelect, handleSelectAll, handleSelectInvert, allSelectedRow, invertSelectedRow, clearSelectedRow]);

    const setSelectedRowKey = useCallback((keys: React.Key[]) => {
        setSelectedRowKeys(keys);
        const selectedKeys = new Set(keys);
        const rows = data.filter(item => selectedKeys.has(item[rowKey]));
        setSelectedRows(rows);
        if (rowSelection && typeof rowSelection === 'object' && rowSelection.onChange) {
            rowSelection.onChange(keys, rows);
        }
    }, [data, rowKey, rowSelection]);
    /**
     * 方法挂载
     */
    useImperativeHandle(ref, () => ({
        searchForm: form,
        refreshTableData: requestData,
        resetTableData: onReset,
        getTableData: () => {
            return {
                data, page, pageSize, sort, total
            }
        },
        getSelectedRowKeys: () => selectedRowKeys,
        getSelectedRows: () => selectedRows,
        setSelectedRowKeys: setSelectedRowKey,
        clearSelectedRows: clearSelectedRow,
        invertSelectedRow: invertSelectedRow,
        allSelectedRow: allSelectedRow
    }));

    const renderSelectionBar = useCallback(() => {
        if ((selectedRowKeys?.length || 0) <= 0) return null;
        const content = (
            <AffixCard
                affix={selectionAffix}
                offsetTop={5}
                filterClassName={styles.filter}
                className={styles.toolCard}
                variant={"borderless"}>
                <Row justify="space-between" align="middle">
                    <Col>
                        {(typeof rowSelection?.leftExtra === "function" && rowSelection?.leftExtra?.(selectedRowKeys, selectedRows)) || rowSelection?.leftExtra || <>已选择 {selectedRowKeys?.length} 项 <a
                            onClick={clearSelectedRow}>取消选择</a></>}
                    </Col>
                    <Col>
                        <Space>
                            {(typeof rowSelection?.rightExtra === "function" && rowSelection?.rightExtra?.(selectedRowKeys, selectedRows)) || rowSelection?.rightExtra}
                        </Space>
                    </Col>
                </Row>
            </AffixCard>
        );
        if (rowSelection?.hideExtra === true) {
            return false;
        }
        return <Col span={(selectedRowKeys?.length || 0) <= 0 ? 0 : 24}>
            {content}
        </Col>;
    }, [selectedRowKeys, selectedRows, rowSelection, selectionAffix, styles, clearSelectedRow]);

    const onPageChange = useCallback((page: number, pageSize: number) => {
        setPage(page);
        setPageSize(pageSize);
    }, []);
    const smallPagination = device.xs || device.sm;
    const showPaginationTotal = useCallback((total: number, range: [number, number]) => smallPagination ? false : `第 ${range[0]}-${range[1]} 条 / 共 ${total} 条`, [smallPagination]);
    const onTableChange = useCallback((_: any, filters: any, sorter: any) => {
        if (Object.keys(filters).length > 0) {
            setParams(prev => ({...prev, ...filters}));
        }
        if (Object.keys(sorter).length > 0 && sorter?.field) {
            let temp: any = {};
            temp[sorter?.field] = sorter?.order;
            setSort(temp);
        }
    }, []);

    const renderPagination = useCallback(() => {
        if (pageHidden || pageInTable || total <= 0) return null;
        return (
            <AffixCard
                affix={paginationAffix}
                offsetBottom={5}
                filterClassName={styles.filter}
                className={styles.pageCard}
                variant={"borderless"}>
                <Pagination
                    align="center"
                    showTotal={showPaginationTotal}
                    showQuickJumper={!smallPagination}
                    pageSizeOptions={[10, 20, 50, 100]}
                    {...paginationProps}
                    showSizeChanger={{
                        showSearch: false,
                        variant: "filled",
                        size: "small",
                    }}
                    showLessItems={true}
                    size={"small"}
                    current={page}
                    pageSize={pageSize}
                    total={total}
                    onChange={onPageChange}
                />
            </AffixCard>
        );
    }, [pageHidden, pageInTable, total, page, pageSize, paginationProps, smallPagination, showPaginationTotal, paginationAffix, styles, onPageChange]);

    return (
        <Row gutter={[15, 15]} ref={containerRef}>
            <Col span={!search ? 0 : 24}>
                <Card variant={"borderless"}>
                    <SearchForm layout={search?.layout || "vertical"} form={form} onReset={onReset}
                                onFinish={onFinish} renderItems={getSearchFormItem}/>
                </Card>
            </Col>

            {renderSelectionBar()}
            <Col span={24}>
                <Card title={title} extra={getTableExtra} className={styles.tableCard} variant={"borderless"}>
                    <Table
                        rowKey={rowKey}
                        className={styles.table}
                        style={{whiteSpace: "nowrap"}}
                        scroll={{x: true, y: virtual ? 500 : undefined}}
                        virtual={virtual}
                        {...tableProps}
                        rowSelection={getRowSelection}
                        pagination={!pageHidden && pageInTable ? {
                            ...{
                                pageSizeOptions: [10, 20, 50, 100],
                            }, ...paginationProps, ...{
                                current: page,
                                pageSize: pageSize,
                                total: total,
                                size: "small",
                                showSizeChanger: {
                                    showSearch: false,
                                    variant: "filled",
                                    size: "small",
                                },
                                showQuickJumper: !smallPagination,
                                showLessItems: true,
                                showTotal: showPaginationTotal,
                                onChange: onPageChange
                            } as any
                        } : false}
                        size={"small"}
                        columns={getTableColumns as any}
                        dataSource={data}
                        loading={loading}
                        onChange={onTableChange}/>
                </Card>
            </Col>
            {!pageHidden && !pageInTable && total > 0 && <Col span={24}>
                {renderPagination()}
            </Col>}
        </Row>
    );
};

// 请求、分页和选中状态在内容层更新，不重复计算整套样式。
const ProTableComponent = forwardRef<ProTableRef, ProTableProps>((props, ref) => {
    const {styles} = useStyles();
    return <ProTableContent ownerProps={props} tableRef={ref} styles={styles}/>;
});

export default ProTableComponent;
