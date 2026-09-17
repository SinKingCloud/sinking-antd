import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState} from "react";
import type {Key} from "react";
import {
    Affix, App, Button, Card, ConfigProvider, DatePicker, Dropdown,
    Empty, Input, Pagination, Select, Spin, Table as AntTable, Tooltip,
} from "antd";
import type {AffixProps, ButtonProps, MenuProps, PaginationProps, TableProps as AntTableProps} from "antd";
import dayjs from "dayjs";
import type {Dayjs} from "dayjs";
import {Icon} from "../icon";
import {useTheme} from "../theme";
import useStyles, {useHeroGraphicStyles} from "./styles";

// ============ 类型定义 ============
interface TableDateFilterProps {
    value: [Dayjs, Dayjs] | null;
    onChange: (value: [Dayjs, Dayjs] | null) => void;
    ariaLabel?: string;
    disabled?: boolean;
    tooltip?: React.ReactNode;
    presets?: {value: string; label: React.ReactNode; days: number}[];
}

type CommandBase = {key: React.Key; hidden?: boolean; tooltip?: React.ReactNode};
type TableToolbarItem = CommandBase & (
    | ({type: "button"} & TableActionProps)
    | ({type: "filter"} & TableFilterProps)
    | ({type: "date"} & TableDateFilterProps)
    | ({type: "icon"; icon: string; ariaLabel: string} & Omit<TableActionProps, "label">)
    | {type: "custom"; render: React.ReactNode}
);
type TableActionItem = TableToolbarItem;

interface TableSearchConfig extends Omit<TableSearchProps, "value" | "onChange" | "placeholder"> {
    value?: string;
    defaultValue?: string;
    /** 单输入框模式的请求字段，默认 keyword；组合模式使用选中的 fields.value。 */
    name?: string;
    /** 组合搜索默认字段，省略时选择 fields 第一项。 */
    defaultField?: string;
    placeholder?: string;
    onChange?: (value: string) => void;
    /** 设置后输入自动搜索；省略时通过回车、失焦或清空搜索。 */
    debounce?: number;
}

interface TableSelectFilterConfig {
    type: "select";
    name: string;
    label: string;
    icon?: string;
    hidden?: boolean;
    disabled?: boolean;
    tooltip?: React.ReactNode;
    options?: TableFilterProps["options"];
    valueEnum?: Record<string, React.ReactNode>;
    /** 默认提供“全部”选项，false 则不添加。 */
    allLabel?: React.ReactNode | false;
    defaultValue?: string;
    value?: string;
    onChange?: (value: string) => void;
    transform?: (value: string) => Record<string, unknown>;
}

interface TableDateFilterConfig extends Omit<TableDateFilterProps, "value" | "onChange" | "ariaLabel"> {
    type: "date";
    name: string;
    label?: string;
    hidden?: boolean;
    /** 默认输出 name_start / name_end，包含所选日期的全天。 */
    fields?: [string, string];
    defaultValue?: [Dayjs, Dayjs] | null;
    value?: [Dayjs, Dayjs] | null;
    onChange?: (value: [Dayjs, Dayjs] | null) => void;
    transform?: (value: [Dayjs, Dayjs] | null) => Record<string, unknown>;
}

type TableFilterConfig = TableSelectFilterConfig | TableDateFilterConfig;

interface TableToolbarConfig {
    left?: React.ReactNode;
    search?: TableSearchConfig;
    /** PageTable 和 ModalTable 共用，支持日期、下拉筛选、按钮、图标和自定义内容。 */
    actions?: TableToolbarItem[];
    /** 请求模式默认显示；省略 onClick / loading 时使用组件内部状态。 */
    refresh?: (Omit<TableRefreshProps, "onClick"> & {onClick?: () => void}) | boolean;
}

interface TableContentBarProps {
    content?: React.ReactNode;
    actions?: TableToolbarItem[];
    ariaLabel?: string;
}

type TableRowSelection<RecordType extends object = any> = NonNullable<AntTableProps<RecordType>["rowSelection"]> & {
    actions?: TableToolbarItem[] | ((keys: React.Key[], rows: RecordType[]) => TableToolbarItem[]);
    onClear?: () => void;
    clearDisabled?: boolean;
};

interface TableRequestParams extends Record<string, unknown> {
    current: number;
    pageSize: number;
}
type TableSort = Record<string, "ascend" | "descend">;
interface TableRequestResult<RecordType> {
    data?: RecordType[] | null;
    total: number;
    success?: boolean;
}

export interface PageTableProps<RecordType extends object = any> extends Omit<DataTableProps<RecordType>, "rowSelection"> {
    hero?: TableHeroProps | false;
    toolbar?: TableToolbarConfig | false;
    /** true 使用默认搜索框；配置对象可自定义字段、提示和防抖。 */
    search?: TableSearchConfig | boolean;
    /** 自动维护筛选值，变化后回到第一页并请求。 */
    filters?: TableFilterConfig[];
    contentBar?: TableContentBarProps | false;
    rowSelection?: TableRowSelection<RecordType> | boolean;
    pagination?: Partial<PageTablePaginationProps> | false;
    /** 分页切换后是否滚动到表格顶部，默认保留当前滚动位置。 */
    scrollToTopOnPageChange?: boolean;
    /** 开启分页固钉，或传入 Ant Design Affix 配置；默认关闭。 */
    paginationAffix?: boolean | Omit<AffixProps, "children">;
    ariaLabel?: string;
    rootClassName?: string;
    /** 外层容器样式，宽高和页面布局由调用方控制。 */
    rootStyle?: React.CSSProperties;
    empty?: boolean;
    emptyContent?: React.ReactNode;
    /** 仅用于包裹表格的业务上下文，例如文件右键菜单 Provider。 */
    tableRender?: (table: React.ReactNode) => React.ReactNode;
    /** 与 ProTable 一致，接收 current / pageSize 及查询条件，返回 {data, total, success?}。 */
    request?: (params: TableRequestParams, sort: TableSort) => Promise<TableRequestResult<RecordType>>;
    params?: Record<string, unknown>;
    defaultPage?: number;
    defaultPageSize?: number;
    defaultSort?: TableSort;
    manualRequest?: boolean;
    /** false 时暂停所有请求并忽略未完成的响应，适用于隐藏的面板。 */
    requestEnabled?: boolean;
    onLoad?: (data: RecordType[], result: TableRequestResult<RecordType>) => void;
    onRequestError?: (error: Error) => void;
    /** 受控 dataSource 模式下供 ref.reload / refresh:true 调用。 */
    onReload?: () => void | Promise<unknown>;
}

export interface PageTableRef<RecordType extends object = any> {
    reload: () => void;
    refreshTableData: () => void;
    resetTableData: () => void;
    getTableData: () => readonly RecordType[];
    getSelectedRowKeys: () => React.Key[];
    getSelectedRows: () => RecordType[];
    setSelectedRowKeys: (keys: React.Key[]) => void;
    clearSelectedRows: () => void;
    allSelectedRow: () => void;
    invertSelectedRow: () => void;
    scrollToTop: () => void;
}

// ============ 背景图形 ============
const TaskGraphic = ({styles, id}: any): React.ReactNode => (
    <svg className={`${styles.graphic} hero-flow-graphic`} viewBox="0 0 480 132"
         aria-hidden="true" focusable="false">
        <defs>
            <linearGradient id={`${id}-flow`} x1="38" y1="90" x2="456" y2="52"
                            gradientUnits="userSpaceOnUse">
                <stop stopColor="currentColor" stopOpacity="0"/>
                <stop offset=".24" stopColor="currentColor" stopOpacity=".24"/>
                <stop offset=".58" stopColor="currentColor" stopOpacity=".7"/>
                <stop offset="1" stopColor="currentColor" stopOpacity=".04"/>
            </linearGradient>
            <radialGradient id={`${id}-aura`} cx="0" cy="0" r="1"
                            gradientTransform="translate(322 63) rotate(90) scale(60 132)"
                            gradientUnits="userSpaceOnUse">
                <stop stopColor="currentColor" stopOpacity=".12"/>
                <stop offset=".55" stopColor="currentColor" stopOpacity=".035"/>
                <stop offset="1" stopColor="currentColor" stopOpacity="0"/>
            </radialGradient>
        </defs>
        <g className="flow-scene">
            <ellipse className="flow-aura" cx="322" cy="63" rx="132" ry="60"
                     fill={`url(#${id}-aura)`}/>
            <path className="flow-line flow-secondary flow-detail"
                  d="M34 108C116 87 139 29 229 35S346 107 468 52"/>
            <path className="flow-line flow-dash flow-detail"
                  d="M60 30C143 28 174 84 255 86S371 38 454 72"/>
            <path className="flow-line flow-primary" stroke={`url(#${id}-flow)`}
                  d="M26 88C106 84 143 49 215 51S324 94 457 58"/>
            <path className="flow-line flow-signal"
                  d="M26 88C106 84 143 49 215 51S324 94 457 58"/>
            <g className="flow-node flow-node-a" transform="translate(154 57)">
                <circle className="node-halo" r="13"/>
                <circle className="node-core" r="3.4"/>
            </g>
            <g className="flow-node flow-node-b flow-secondary" transform="translate(282 78)">
                <circle className="node-halo" r="10"/>
                <circle className="node-core" r="2.8"/>
            </g>
            <g className="flow-node flow-node-c" transform="translate(390 67)">
                <circle className="node-halo" r="14"/>
                <circle className="node-core" r="3.6"/>
            </g>
        </g>
    </svg>
);

const SettingGraphic = ({styles, id}: any): React.ReactNode => (
    <svg className={`${styles.graphic} hero-setting-graphic`} viewBox="0 0 480 132"
         aria-hidden="true" focusable="false">
        <defs>
            <linearGradient id={`${id}-edge`} x1="76" y1="101" x2="438" y2="28"
                            gradientUnits="userSpaceOnUse">
                <stop stopColor="currentColor" stopOpacity="0"/>
                <stop offset=".44" stopColor="currentColor" stopOpacity=".28"/>
                <stop offset="1" stopColor="currentColor" stopOpacity=".04"/>
            </linearGradient>
            <radialGradient id={`${id}-aura`} cx="0" cy="0" r="1"
                            gradientTransform="translate(316 64) rotate(90) scale(60 138)"
                            gradientUnits="userSpaceOnUse">
                <stop stopColor="currentColor" stopOpacity=".11"/>
                <stop offset=".62" stopColor="currentColor" stopOpacity=".03"/>
                <stop offset="1" stopColor="currentColor" stopOpacity="0"/>
            </radialGradient>
        </defs>
        <ellipse className="setting-aura" cx="316" cy="64" rx="138" ry="60"
                 fill={`url(#${id}-aura)`}/>
        <path className="setting-orbit setting-detail"
              d="M70 102C139 77 175 31 254 30S370 77 454 43"/>
        <path className="setting-trace" stroke={`url(#${id}-edge)`}
              d="M96 93C163 86 193 63 238 63"/>
        <g className="setting-stack">
            <rect className="setting-sheet setting-detail" x="238" y="23" width="142" height="82" rx="22"
                  transform="rotate(-7 309 64)"/>
            <rect className="setting-sheet setting-detail" x="270" y="22" width="132" height="84" rx="22"
                  transform="rotate(6 336 64)"/>
            <rect className="setting-sheet front" x="250" y="27" width="146" height="78" rx="21"/>
            <rect className="setting-chip" x="270" y="46" width="42" height="8" rx="4"/>
            <rect className="setting-chip muted" x="321" y="46" width="54" height="8" rx="4"/>
            <rect className="setting-chip muted" x="270" y="64" width="68" height="8" rx="4"/>
            <rect className="setting-chip" x="347" y="64" width="28" height="8" rx="4"/>
            <rect className="setting-chip muted" x="270" y="82" width="32" height="8" rx="4"/>
            <rect className="setting-chip muted" x="311" y="82" width="64" height="8" rx="4"/>
        </g>
        <g className="setting-point setting-point-a" transform="translate(181 75)">
            <circle className="setting-point-halo" r="12"/>
            <circle className="setting-point-core" r="3.2"/>
        </g>
        <g className="setting-point setting-point-b setting-detail" transform="translate(430 38)">
            <circle className="setting-point-halo" r="9"/>
            <circle className="setting-point-core" r="2.6"/>
        </g>
    </svg>
);

const HeroGraphic = React.memo(({variant = "task"}: any): React.ReactNode => {
    const {styles} = useHeroGraphicStyles();
    const id = React.useId().replace(/:/g, "");
    return variant === "setting"
        ? <SettingGraphic styles={styles} id={`setting-${id}`}/>
        : <TaskGraphic styles={styles} id={`task-${id}`}/>;
});

// ============ 内部展示组件 ============
const useTableStyles = () => {
    const theme = useTheme();
    return useStyles({
        compact: Boolean(theme?.isCompactTheme?.()),
        dark: Boolean(theme?.isDarkMode?.() || theme?.isDarkTheme?.()),
    });
};

interface PageTablePaginationProps {
    page: number;
    pageSize: number;
    total: number;
    disabled?: boolean;
    unit?: string;
    pageSizeOptions?: number[];
    affixed?: boolean;
    onChange: (page: number, pageSize: number) => void;
}

const TablePagination = ({
    page,
    pageSize,
    total,
    disabled,
    unit = "条",
    pageSizeOptions = [10, 20, 50, 100],
    affixed = false,
    onChange,
}: PageTablePaginationProps) => {
    const {styles} = useTableStyles();
    if (total <= 0) {
        return null;
    }

    return (
        <Card className={`${styles.paginationCard} ${affixed ? "ui-table-pagination-affixed" : ""}`} variant="borderless">
            <ConfigProvider input={{variant: "filled"}}>
                <Pagination
                    className={styles.pagination}
                    size="small"
                    current={page}
                    pageSize={pageSize}
                    total={total}
                    disabled={disabled}
                    align="center"
                    responsive
                    showQuickJumper
                    showLessItems
                    showSizeChanger={{
                        showSearch: false,
                        variant: "filled",
                        size: "small",
                        className: styles.pageSizeSelect,
                        classNames: {popup: {root: styles.pageSizeDropdown}},
                    } as PaginationProps["showSizeChanger"]}
                    pageSizeOptions={pageSizeOptions}
                    showTotal={(nextTotal, range) => `第 ${range[0]}-${range[1]} ${unit} / 共 ${nextTotal} ${unit}`}
                    onChange={onChange}/>
            </ConfigProvider>
        </Card>
    );
};

interface TableHeroAction {
    label: React.ReactNode;
    ariaLabel?: string;
    icon?: string;
    suffixIcon?: string;
    disabled?: boolean;
    menu?: MenuProps;
    onClick?: () => void;
}

interface TableHeroProps {
    title: React.ReactNode;
    eyebrow?: React.ReactNode;
    action?: TableHeroAction;
    background?: boolean | React.CSSProperties;
    graphic?: false | "task" | "setting";
}

const TableHero = React.memo(({title, eyebrow, action, background = true, graphic = "task"}: TableHeroProps) => {
    const {styles} = useTableStyles();
    const button = action ? (
        <button
            className="create-button"
            type="button"
            aria-label={action.ariaLabel}
            disabled={action.disabled}
            onClick={action.menu ? undefined : action.onClick}>
            {action.icon && <Icon type={action.icon}/>}
            <span>{action.label}</span>
            {action.suffixIcon && <Icon type={action.suffixIcon} className="suffix-icon"/>}
        </button>
    ) : null;

    return (
        <section className={`${styles.hero} ${background === false ? "plain-background" : ""} ${action ? "" : "without-action"}`}
                 style={typeof background === "object" ? background : undefined}>
            <div className="hero-copy">
                {eyebrow && <div className="eyebrow"><span className="status-dot"/>{eyebrow}</div>}
                <h1>{title}</h1>
            </div>
            {background !== false && graphic !== false && <div className="hero-visual"><HeroGraphic variant={graphic}/></div>}
            {action?.menu && button ? (
                <Dropdown
                    trigger={["click"]}
                    placement="bottomRight"
                    classNames={{root: styles.toolbarDropdown}}
                    menu={action.menu}>
                    {button}
                </Dropdown>
            ) : button}
        </section>
    );
});

interface TableSearchProps {
    value: string;
    placeholder: string;
    className?: string;
    style?: React.CSSProperties;
    ariaLabel?: string;
    maxLength?: number;
    allowClear?: boolean;
    fields?: {value: string; label: React.ReactNode; placeholder?: string; maxLength?: number}[];
    field?: string;
    tooltip?: React.ReactNode;
    onChange: (value: string) => void;
    onFieldChange?: (field: string) => void;
    onSearch?: (value: string, field?: string) => void;
    onBlur?: (value: string) => void;
}

interface TableRefreshProps {
    loading?: boolean;
    disabled?: boolean;
    ariaLabel?: string;
    tooltip?: React.ReactNode;
    onClick: () => void;
}

interface TableToolbarProps {
    left?: React.ReactNode;
    search?: TableSearchProps;
    refresh?: TableRefreshProps;
    children?: React.ReactNode;
    extra?: React.ReactNode;
}

const TableSearch = React.memo((search: TableSearchProps) => {
    const {styles} = useTableStyles();
    const field = search.fields?.find((item) => item.value === search.field) || search.fields?.[0];
    const className = `${styles.searchBox} ui-table-search ${search.className || ""}`;
    const onBlur: React.FocusEventHandler<HTMLElement> = (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) search.onBlur?.(search.value);
    };
    const searchInput = <Input
        className={field ? "search-input" : className}
        style={field ? undefined : search.style}
        variant={field ? "borderless" : "filled"}
        styles={field ? {root: {outline: "none", boxShadow: "none"}, input: {outline: "none", boxShadow: "none"}} : undefined}
        value={search.value}
        aria-label={search.ariaLabel}
        allowClear={search.allowClear !== false}
        maxLength={field?.maxLength ?? search.maxLength}
        prefix={field ? undefined : <Icon type="SearchOutlined"/>}
        placeholder={field?.placeholder ?? search.placeholder}
        onChange={(event) => search.onChange(event.target.value)}
        onBlur={field ? undefined : onBlur}
        onPressEnter={search.onSearch
            ? (event) => search.onSearch?.(event.currentTarget.value, field?.value)
            : undefined}/>;
    const searchControl = field ? <div className={`${className} ${styles.searchGroup}`} style={search.style} onBlur={onBlur}>
        <Select
            className="search-field"
            classNames={{popup: {root: styles.pageSizeDropdown}}}
            styles={{root: {outline: "none", boxShadow: "none", border: 0}}}
            variant="borderless"
            aria-label="搜索字段"
            title=""
            value={field.value}
            showSearch={false}
            popupMatchSelectWidth={false}
            options={search.fields?.map(({value, label}) => ({value, label, title: ""}))}
            labelRender={({label}) => <span className="search-field-label">{label}</span>}
            onChange={search.onFieldChange}/>
        {searchInput}
    </div> : searchInput;
    return search.tooltip ? <Tooltip title={search.tooltip}>{searchControl}</Tooltip> : searchControl;
});

const TableToolbar = React.memo(({left, search, refresh, children, extra}: TableToolbarProps) => {
    const {styles} = useTableStyles();
    const hasLeft = left !== undefined && left !== null && left !== false;
    const refreshButton = refresh && <Button
        className={styles.toolbarIconButton}
        type="text"
        aria-label={refresh.ariaLabel || "刷新列表"}
        loading={refresh.loading}
        disabled={refresh.disabled}
        icon={<Icon type="ReloadOutlined"/>}
        onClick={refresh.onClick}/>;
    return (
        <div className={`${styles.commandBar} ui-table-toolbar ${!search && !hasLeft ? "without-search" : ""} ${hasLeft && !search ? "with-content" : ""}`}>
            {hasLeft && <div className="command-content">{left}</div>}
            {search && <TableSearch {...search}/>}
            <div className="command-actions">
                {hasLeft && extra}
                <div className="command-actions-scroll">{children}</div>
                {!hasLeft && extra}
                {refresh?.tooltip ? <Tooltip title={refresh.tooltip}>{refreshButton}</Tooltip> : refreshButton}
            </div>
        </div>
    );
});

interface TableFilterOption {
    value: string;
    label: React.ReactNode;
}

interface TableFilterCommand {
    label: React.ReactNode;
    icon?: string;
    onClick: () => void;
}

interface TableFilterProps {
    value: string;
    options: TableFilterOption[];
    icon: string;
    ariaLabel: string;
    title?: string;
    tooltip?: React.ReactNode;
    disabled?: boolean;
    matchWidth?: boolean;
    command?: TableFilterCommand;
    onChange: (value: string) => void;
}

const TableFilter = React.memo(({
    value,
    options,
    icon,
    ariaLabel,
    title,
    tooltip,
    disabled,
    matchWidth,
    command,
    onChange,
}: TableFilterProps) => {
    const {styles} = useTableStyles();
    const commandKey = "__table_filter_command__";
    const active = options.find((item) => item.value === value) || options[0];
    const items = useMemo<MenuProps["items"]>(() => [
        ...options.map((item) => ({key: item.value, label: item.label})),
        ...(command ? [
            {type: "divider" as const},
            {
                key: commandKey,
                label: command.label,
                icon: command.icon ? <Icon type={command.icon}/> : undefined,
            },
        ] : []),
    ], [command, options]);

    const dropdown = (
        <Dropdown
            disabled={disabled}
            trigger={["click"]}
            placement="bottomRight"
            classNames={{root: styles.toolbarDropdown}}
            menu={{
                selectable: true,
                selectedKeys: [value],
                items,
                onClick: ({key}) => key === commandKey ? command?.onClick() : onChange(key),
            }}>
            <button
                className={`${styles.toolbarTrigger} ${matchWidth ? "match-width" : ""}`}
                type="button"
                disabled={disabled}
                aria-label={ariaLabel}>
                <Icon type={icon} className="marker"/>
                {matchWidth ? (
                    <span className="value-stack" title={title}>
                        {options.map((item) => (
                            <span className="value measure" aria-hidden="true" key={item.value}>{item.label}</span>
                        ))}
                        <span className="value active">{active?.label}</span>
                    </span>
                ) : (
                    <span className="value" title={title}>{active?.label}</span>
                )}
                <Icon type="DownOutlined" className="arrow"/>
            </button>
        </Dropdown>
    );
    return tooltip ? <Tooltip title={tooltip}>{dropdown}</Tooltip> : dropdown;
});

interface TableActionProps extends Omit<ButtonProps, "icon" | "children" | "type"> {
    label: React.ReactNode;
    icon?: string;
    suffixIcon?: string;
    tooltip?: React.ReactNode;
    menu?: MenuProps;
    menuClassName?: string;
    placement?: "bottom" | "bottomLeft" | "bottomRight" | "top" | "topLeft" | "topRight";
}

const TableAction = React.memo(({
    label,
    icon,
    suffixIcon,
    tooltip,
    menu,
    menuClassName = "",
    placement = "bottomRight",
    className = "",
    ...buttonProps
}: TableActionProps) => {
    const {styles} = useTableStyles();
    const button = (
        <Button
            {...buttonProps}
            type="text"
            className={`${styles.toolbarAction} ${className}`}
            icon={icon ? <Icon type={icon}/> : undefined}>
            <span className="value">{label}</span>
            {suffixIcon && <Icon type={suffixIcon} className="arrow"/>}
        </Button>
    );
    const control = menu ? (
        <Dropdown
            trigger={["click"]}
            placement={placement}
            classNames={{root: `${styles.toolbarDropdown} ${menuClassName}`}}
            menu={menu}>
            {button}
        </Dropdown>
    ) : button;
    return tooltip ? <Tooltip title={tooltip}>{control}</Tooltip> : control;
});

type DataTableProps<RecordType extends object = any> = Omit<AntTableProps<RecordType>, "pagination"> & {
    onSortChange?: (field: string, order?: "ascend" | "descend") => void;
};

const DataTable = <RecordType extends object = any>({
    className = "",
    scroll,
    showSorterTooltip = false,
    tableLayout = "fixed",
    size = "middle",
    onChange,
    onSortChange,
    ...props
}: DataTableProps<RecordType>) => {
    const {styles} = useTableStyles();
    const change = useCallback<NonNullable<AntTableProps<RecordType>["onChange"]>>((pagination, filters, sorter, extra) => {
        onChange?.(pagination, filters, sorter, extra);
        if (extra.action !== "sort" || !onSortChange) {
            return;
        }
        const current = Array.isArray(sorter) ? sorter[0] : sorter;
        const field = current?.field || current?.columnKey;
        onSortChange(Array.isArray(field) ? field.join(".") : typeof field === "string" ? field : "", current?.order || undefined);
    }, [onChange, onSortChange]);

    return (
        <AntTable<RecordType>
            {...props}
            className={`${styles.table} ${className}`}
            pagination={false}
            scroll={{x: "max-content", ...scroll}}
            showSorterTooltip={showSorterTooltip}
            tableLayout={tableLayout}
            size={size}
            onChange={change}/>
    );
};

// ============ 工具栏与批量操作 ============
const datePresets = [
    {value: "all", label: "全部时间", days: 0},
    {value: "day", label: "最近一天", days: 1},
    {value: "three-days", label: "最近三天", days: 3},
    {value: "week", label: "最近一周", days: 7},
    {value: "month", label: "最近一月", days: 30},
    {value: "custom", label: "自定义", days: 0},
];

const datePopupAlign = {overflow: {adjustX: true, adjustY: true, shiftX: true}};

const TableDateFilter = ({value, onChange, ariaLabel = "时间筛选", tooltip, disabled, presets = datePresets}: TableDateFilterProps) => {
    const {styles} = useTableStyles();
    const [open, setOpen] = useState(false);
    const today = dayjs();
    const preset = !value ? "all" : presets.find((item) => item.days > 0
        && value[1].isSame(today, "day")
        && value[0].isSame(today.subtract(item.days - 1, "day"), "day"))?.value || "custom";
    const title = value?.[0] && value?.[1]
        ? `${value[0].format("YYYY-MM-DD")} 至 ${value[1].format("YYYY-MM-DD")}`
        : "全部时间";

    return (
        <div className={styles.dateFilter}>
            <TableFilter
                value={preset}
                options={presets}
                disabled={disabled}
                icon="CalendarOutlined"
                ariaLabel={`${ariaLabel}：${title}`}
                tooltip={tooltip}
                onChange={(next) => {
                    if (next === "custom") {
                        setOpen(true);
                        return;
                    }
                    const days = presets.find((item) => item.value === next)?.days;
                    const end = dayjs();
                    onChange(days ? [end.subtract(days - 1, "day"), end] : null);
                }}/>
            <DatePicker.RangePicker
                className={styles.datePickerAnchor}
                classNames={{popup: {root: styles.datePickerPopup}}}
                value={value}
                open={open}
                disabled={disabled}
                tabIndex={-1}
                allowClear
                inputReadOnly
                placement="bottomRight"
                popupAlign={datePopupAlign}
                format="YYYY-MM-DD"
                placeholder={["开始日期", "结束日期"]}
                onOpenChange={setOpen}
                onChange={(range) => {
                    if (range && (!range[0] || !range[1])) return;
                    onChange(range ? [range[0]!, range[1]!] : null);
                    setOpen(false);
                }}/>
        </div>
    );
};

const TableIconCommand = ({item}: {item: Omit<Extract<TableToolbarItem, {type: "icon"}>, "key" | "hidden">}) => {
    const {styles} = useTableStyles();
    const {type, icon, ariaLabel, tooltip, suffixIcon, menu, menuClassName = "", placement = "bottomRight", ...props} = item;
    const button = <Button {...props} type="text" aria-label={ariaLabel}
        className={`${styles.toolbarIconButton} ${props.className || ""}`}
        icon={<Icon type={icon}/>}>{suffixIcon && <Icon type={suffixIcon}/>}</Button>;
    const control = menu ? <Dropdown trigger={["click"]} placement={placement}
        classNames={{root: `${styles.toolbarDropdown} ${menuClassName}`}} menu={menu}>{button}</Dropdown> : button;
    return tooltip ? <Tooltip title={tooltip}>{control}</Tooltip> : control;
};

const TableCommand = ({item}: {item: TableToolbarItem}) => {
    const {key: _, hidden, ...command} = item;
    if (hidden) return null;
    switch (command.type) {
        case "button": {
            const {type, ...props} = command;
            return <TableAction {...props}/>;
        }
        case "filter": {
            const {type, ...props} = command;
            return <TableFilter {...props}/>;
        }
        case "date": {
            const {type, ...props} = command;
            return <TableDateFilter {...props}/>;
        }
        case "icon": return <TableIconCommand item={command}/>;
        case "custom": return command.tooltip
            ? <Tooltip title={command.tooltip}><span className="table-custom-action">{command.render}</span></Tooltip>
            : <>{command.render}</>;
    }
};

const TableCommands = ({items = []}: {items?: TableToolbarItem[]}) => (
    <>{items.map((item) => <TableCommand key={item.key} item={item}/>)}</>
);

const TableSelectionAction = ({count, items, onClear, clearDisabled}: {
    count: number;
    items: TableToolbarItem[];
    onClear: () => void;
    clearDisabled?: boolean;
}) => {
    if (!count) return null;
    const menuItems: MenuProps["items"] = items.filter((item) => !item.hidden).map((item) => {
        if (item.type !== "button") return {key: item.key, label: <TableCommand item={item}/>};
        return {
            key: item.key,
            label: item.tooltip ? <Tooltip title={item.tooltip}><span>{item.label}</span></Tooltip> : item.label,
            icon: item.icon ? <Icon type={item.icon}/> : undefined,
            danger: item.danger,
            disabled: item.disabled || Boolean(item.loading),
            children: item.menu?.items,
            onClick: ({domEvent}) => item.onClick?.(domEvent as React.MouseEvent<HTMLElement>),
        };
    });
    if (menuItems.length) menuItems.push({type: "divider"});
    menuItems.push({key: "__clear_selection__", label: "取消选择", icon: <Icon type="CloseOutlined"/>, disabled: clearDisabled, onClick: onClear});
    return <TableAction
        className="table-selection-action"
        label={`已选 ${count} 项`}
        icon="CheckSquareOutlined"
        suffixIcon="DownOutlined"
        aria-label={`批量操作，已选 ${count} 项`}
        menu={{
            items: menuItems,
            onClick: (info) => {
                const parent = items.find((item) => item.type === "button" && item.menu && info.keyPath.includes(String(item.key)));
                if (parent?.type === "button") parent.menu?.onClick?.(info);
            },
        }}/>;
};

// ============ 数据请求与分页 ============
function useTableData<RecordType extends object>(props: PageTableProps<RecordType>) {
    const {message} = App.useApp();
    const latest = useRef(props);
    latest.current = props;
    const searchConfig = typeof props.search === "object" ? props.search : undefined;
    const fields = searchConfig?.fields;
    const defaultField = fields?.find((field) => field.value === searchConfig?.defaultField)?.value || fields?.[0]?.value || "";
    const hasSearch = Boolean(searchConfig);
    const [query, setQuery] = useState(() => ({
        page: props.defaultPage || 1,
        pageSize: props.defaultPageSize || 10,
        keyword: (searchConfig?.value ?? searchConfig?.defaultValue ?? "").trim(),
        field: defaultField,
        sort: props.defaultSort || {} as TableSort,
    }));
    const searchName = fields?.length
        ? fields.find((field) => field.value === (searchConfig?.field ?? query.field))?.value || defaultField
        : searchConfig?.name || "keyword";
    // 空搜索词切换字段不改变查询条件，也不打断正在加载的请求。
    const searchKey = hasSearch && query.keyword ? searchName : "";
    const [result, setResult] = useState({data: [] as RecordType[], total: 0});
    const [loading, setLoading] = useState(Boolean(props.request && !props.manualRequest && props.requestEnabled !== false));
    const [revision, setRevision] = useState(0);
    const requestVersion = useRef(0);
    const handledRevision = useRef(0);
    const adjustedPage = useRef<number | undefined>(undefined);
    const pagination = props.pagination || {};
    const page = pagination.page ?? query.page;
    const pageSize = pagination.pageSize ?? query.pageSize;
    const hasRequest = Boolean(props.request);
    const paramsKey = hasRequest ? JSON.stringify(props.params || {}) : "";
    const sortKey = hasRequest ? JSON.stringify(query.sort) : "";
    const previousParamsKey = useRef(paramsKey);
    const previousSearchKey = useRef(searchKey);

    useEffect(() => {
        if (!hasRequest || props.requestEnabled === false) {
            adjustedPage.current = undefined;
            handledRevision.current = revision;
            setLoading(false);
            return;
        }
        if (props.manualRequest && handledRevision.current === revision && adjustedPage.current !== page) {
            setLoading(false);
            return;
        }
        adjustedPage.current = undefined;
        handledRevision.current = revision;
        if (previousParamsKey.current !== paramsKey || previousSearchKey.current !== searchKey) {
            previousParamsKey.current = paramsKey;
            previousSearchKey.current = searchKey;
            if (page !== 1) {
                setQuery((value) => ({...value, page: 1}));
                if (latest.current.pagination) latest.current.pagination.onChange?.(1, pageSize);
                if (props.manualRequest) setRevision((value) => value + 1);
                return;
            }
        }
        const version = ++requestVersion.current;
        let active = true;
        let pageAdjusted = false;
        const request = latest.current.request!;
        const current = {params: latest.current.params, page, pageSize, keyword: query.keyword, sort: query.sort};
        setLoading(true);
        void (async () => {
            try {
                const response = await request({
                    ...current.params, current: current.page, pageSize: current.pageSize,
                    ...(searchKey ? {[searchKey]: current.keyword} : {}),
                }, current.sort);
                if (!active || version !== requestVersion.current) return;
                if (!response || response.success === false || (response.data != null && !Array.isArray(response.data))) {
                    throw new Error("获取列表失败");
                }
                const data = response.data ?? [];
                const total = Math.max(0, Number(response.total) || 0);
                setResult({data, total});
                latest.current.onLoad?.(data, {...response, data, total});
                const lastPage = Math.max(1, Math.ceil(total / current.pageSize));
                if (current.page > lastPage) {
                    const pagination = latest.current.pagination;
                    const controlled = Boolean(pagination && pagination.page !== undefined);
                    pageAdjusted = total > 0 && !controlled;
                    if (props.manualRequest && controlled) adjustedPage.current = lastPage;
                    setQuery((value) => ({...value, page: lastPage}));
                    if (pagination) pagination.onChange?.(lastPage, current.pageSize);
                    if (props.manualRequest && !controlled) setRevision((value) => value + 1);
                    return;
                }
            } catch (reason) {
                if (!active || version !== requestVersion.current) return;
                const error = reason instanceof Error ? reason : new Error("获取列表失败");
                if (latest.current.onRequestError) latest.current.onRequestError(error);
                else message.error(error.message);
            } finally {
                if (active && version === requestVersion.current && !pageAdjusted) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [hasRequest, props.manualRequest, props.requestEnabled, paramsKey, page, pageSize, query.keyword, searchKey, sortKey, revision, message]);

    const reload = useCallback(() => {
        adjustedPage.current = undefined;
        requestVersion.current += 1;
        if (latest.current.request) setRevision((value) => value + 1);
        else void latest.current.onReload?.();
    }, []);
    const changePage = useCallback((nextPage: number, nextSize: number) => {
        adjustedPage.current = undefined;
        const config = latest.current.pagination || {};
        const resolvedPage = nextSize === pageSize ? nextPage : 1;
        if (config.page === undefined || config.pageSize === undefined) {
            setQuery((value) => {
                const page = config.page === undefined ? resolvedPage : value.page;
                const pageSize = config.pageSize === undefined ? nextSize : value.pageSize;
                return page === value.page && pageSize === value.pageSize ? value : {...value, page, pageSize};
            });
        }
        config.onChange?.(resolvedPage, nextSize);
    }, [pageSize]);
    const search = useCallback((keyword: string, field?: string) => {
        adjustedPage.current = undefined;
        const config = latest.current.pagination;
        const nextKeyword = keyword.trim();
        const fieldOnly = field !== undefined && !nextKeyword;
        if (latest.current.request) {
            setQuery((value) => {
                const nextField = field ?? value.field;
                const page = fieldOnly ? value.page : 1;
                return value.page === page && value.keyword === nextKeyword && value.field === nextField
                    ? value : {...value, page, keyword: nextKeyword, field: nextField};
            });
        } else {
            setQuery((value) => {
                const page = !fieldOnly && config !== false && config?.page === undefined ? 1 : value.page;
                const nextField = field ?? value.field;
                return page === value.page && nextField === value.field ? value : {...value, page, field: nextField};
            });
        }
        if (!fieldOnly && latest.current.request && config && config.page !== undefined) config.onChange?.(1, config.pageSize || pageSize);
    }, [pageSize]);
    const changeSort = useCallback((field: string, order?: "ascend" | "descend") => {
        adjustedPage.current = undefined;
        const config = latest.current.pagination;
        if (latest.current.request) {
            const sort = field && order ? {[field]: order} : latest.current.defaultSort || {};
            setQuery((value) => value.page === 1 && JSON.stringify(value.sort) === JSON.stringify(sort) ? value : {...value, page: 1, sort});
        } else if (config !== false && config?.page === undefined) {
            setQuery((value) => value.page === 1 ? value : {...value, page: 1});
        }
        latest.current.onSortChange?.(field, order);
        if (latest.current.request && config && config.page !== undefined) config.onChange?.(1, config.pageSize || pageSize);
    }, [pageSize]);
    const reset = useCallback(() => {
        const resetSize = latest.current.defaultPageSize || 10;
        const config = latest.current.pagination || undefined;
        const search = typeof latest.current.search === "object" ? latest.current.search : undefined;
        const field = search?.fields?.find((field) => field.value === search.defaultField)?.value || search?.fields?.[0]?.value || "";
        if (latest.current.request) {
            const keyword = search?.defaultValue || "";
            setQuery({page: 1, pageSize: resetSize, keyword: keyword.trim(), field, sort: latest.current.defaultSort || {}});
        } else {
            setQuery((value) => {
                const page = latest.current.pagination !== false && config?.page === undefined ? 1 : value.page;
                const pageSize = latest.current.pagination !== false && config?.pageSize === undefined ? resetSize : value.pageSize;
                return page === value.page && pageSize === value.pageSize && field === value.field ? value : {...value, page, pageSize, field};
            });
        }
        if (config?.onChange && (page !== 1 || pageSize !== resetSize)) {
            config.onChange(1, resetSize);
            // 受控列表换页已由父级发起请求，不能再用旧页码刷新。
            if (!latest.current.request) return;
        }
        reload();
    }, [page, pageSize, reload]);

    const source = props.dataSource ?? result.data;
    const localPagination = !hasRequest && props.pagination !== false && pagination.total === undefined && !pagination.onChange;
    const resolvedPage = localPagination ? Math.min(page, Math.max(1, Math.ceil(source.length / pageSize))) : page;
    const data = useMemo(() => localPagination ? source.slice((resolvedPage - 1) * pageSize, resolvedPage * pageSize) : source,
        [source, localPagination, resolvedPage, pageSize]);
    return {
        data,
        loading: props.loading ?? loading,
        total: pagination.total ?? (hasRequest ? result.total : source.length),
        page: resolvedPage, pageSize, sort: query.sort, searchName, reload, changePage, search, changeSort, reset,
    };
}

// ============ 行选择 ============
function useTableSelection<RecordType extends object>(
    data: readonly RecordType[],
    rowKey: NonNullable<DataTableProps<RecordType>["rowKey"]>,
    config: PageTableProps<RecordType>["rowSelection"],
) {
    const selection = config ? (config === true ? {} : config) : undefined;
    const enabled = Boolean(selection);
    const controlled = selection?.selectedRowKeys !== undefined;
    const preserve = Boolean(selection?.preserveSelectedRowKeys);
    const [internalKeys, setInternalKeys] = useState<Key[]>(() => selection?.defaultSelectedRowKeys || []);
    const selectedRecords = useRef<Map<Key, RecordType> | undefined>(undefined);
    const records = useMemo(() => {
        if (!enabled) return undefined;
        const indexed = new Map<Key, RecordType>();
        data.forEach((row, index) => indexed.set(
            typeof rowKey === "function" ? rowKey(row, index) : (row as Record<PropertyKey, Key>)[rowKey], row,
        ));
        return indexed;
    }, [data, rowKey, enabled]);
    const requestedKeys = selection?.selectedRowKeys ?? internalKeys;
    const keys = useMemo(() => {
        if (!enabled) return [];
        if (controlled || preserve) return requestedKeys;
        const available = requestedKeys.filter((key) => records!.has(key));
        return available.length === requestedKeys.length ? requestedKeys : available;
    }, [enabled, controlled, preserve, requestedKeys, records]);

    useEffect(() => {
        if (!records || controlled || preserve) return;
        setInternalKeys((current) => {
            const available = current.filter((key) => records.has(key));
            return available.length === current.length ? current : available;
        });
    }, [records, controlled, preserve]);

    const rows: RecordType[] = [];
    const retained = preserve && keys.length ? new Map<Key, RecordType>() : undefined;
    keys.forEach((key) => {
        const row = records?.get(key) ?? (preserve ? selectedRecords.current?.get(key) : undefined);
        if (row !== undefined) {
            rows.push(row);
            retained?.set(key, row);
        }
    });
    selectedRecords.current = retained;
    const snapshot = useRef({keys, rows});
    snapshot.current = {keys, rows};

    type SelectionChange = NonNullable<NonNullable<AntTableProps<RecordType>["rowSelection"]>["onChange"]>;
    const change = (nextKeys: Key[], info: Parameters<SelectionChange>[2], suppliedRows?: RecordType[]) => {
        if (!selection) return;
        const nextRows: RecordType[] = [];
        const nextRecords = preserve ? new Map<Key, RecordType>() : undefined;
        let suppliedRecords: Map<Key, RecordType> | undefined;
        // 受控父组件可能拒绝变更，在下一次渲染前保留其当前选中的行。
        if (controlled && nextRecords) selection.selectedRowKeys?.forEach((key) => {
            const row = records?.get(key) ?? selectedRecords.current?.get(key);
            if (row !== undefined) nextRecords.set(key, row);
        });
        nextKeys.forEach((key) => {
            let row = records?.get(key) ?? selectedRecords.current?.get(key);
            if (row === undefined && suppliedRows?.length) {
                suppliedRecords ??= new Map(suppliedRows.filter((item) => item !== undefined).map((item) => [
                    typeof rowKey === "function" ? rowKey(item) : (item as Record<PropertyKey, Key>)[rowKey], item,
                ]));
                row = suppliedRecords.get(key);
            }
            if (row !== undefined) {
                nextRows.push(row);
                nextRecords?.set(key, row);
            }
        });
        const next = [...nextKeys];
        selectedRecords.current = nextRecords;
        snapshot.current = {keys: next, rows: nextRows};
        if (!controlled) setInternalKeys(next);
        selection.onChange?.(next, nextRows, info);
    };
    const setKeys = (next: Key[]) => change(next, {type: "multiple"});
    const clear = () => {
        if (!selection || selection.clearDisabled) return;
        selection.onClear?.();
        change([], {type: "none"});
    };
    const selectAll = () => {
        if (!selection) return;
        const next = new Set(snapshot.current.keys);
        records?.forEach((row, key) => {
            if (!selection.getCheckboxProps?.(row).disabled) next.add(key);
        });
        change([...next], {type: "all"});
    };
    const invert = () => {
        if (!selection) return;
        const next = new Set(snapshot.current.keys);
        records?.forEach((row, key) => {
            if (selection.getCheckboxProps?.(row).disabled) return;
            if (next.has(key)) next.delete(key);
            else next.add(key);
        });
        change([...next], {type: "invert"});
    };

    let rowSelection: AntTableProps<RecordType>["rowSelection"];
    if (selection) {
        const {actions, onClear, clearDisabled, ...rest} = selection;
        rowSelection = {...rest, selectedRowKeys: keys, onChange: (next, nextRows, info) => change(next, info, nextRows)};
    }
    return {
        rowSelection,
        keys,
        rows,
        actions: typeof selection?.actions === "function" ? selection.actions(keys, rows) : selection?.actions || [],
        clearDisabled: selection?.clearDisabled,
        clear,
        setKeys,
        selectAll,
        invert,
        getKeys: () => [...snapshot.current.keys],
        getRows: () => [...snapshot.current.rows],
    };
}

// ============ 筛选条件 ============
type FilterState = Record<string, {type: TableFilterConfig["type"]; value?: string | [Dayjs, Dayjs] | null}>;

function useTableFilters(filters?: TableFilterConfig[]) {
    const [values, setValues] = useState<FilterState>(() => Object.fromEntries((filters || []).map((filter) => [
        filter.name, {type: filter.type, value: filter.defaultValue ?? (filter.type === "select" ? undefined : null)},
    ])));

    useEffect(() => {
        setValues((current) => {
            const next: FilterState = {};
            let changed = Object.keys(current).length !== (filters?.length || 0);
            filters?.forEach((filter) => {
                if (current[filter.name]?.type === filter.type) {
                    next[filter.name] = current[filter.name];
                } else {
                    changed = true;
                    next[filter.name] = {type: filter.type, value: filter.defaultValue ?? (filter.type === "select" ? undefined : null)};
                }
            });
            return changed ? next : current;
        });
    }, [filters]);

    const params: Record<string, unknown> = {};
    const items: TableToolbarItem[] = [];
    filters?.forEach((filter) => {
        const stored = values[filter.name]?.type === filter.type ? values[filter.name].value : undefined;
        if (filter.type === "select") {
            const options = filter.options ?? Object.entries(filter.valueEnum || {}).map(([value, label]) => ({value, label}));
            const value = filter.value ?? (stored as string | undefined) ?? filter.defaultValue
                ?? (filter.allLabel === false ? options[0]?.value ?? "" : "");
            Object.assign(params, filter.transform ? filter.transform(value) : {[filter.name]: value});
            items.push({
                type: "filter", key: `filter:${filter.name}`, hidden: filter.hidden,
                value, icon: filter.icon || "FilterOutlined", ariaLabel: filter.label, disabled: filter.disabled,
                tooltip: filter.tooltip,
                options: filter.allLabel !== false && !options.some((option) => option.value === "")
                    ? [{value: "", label: filter.allLabel ?? "全部"}, ...options] : options,
                onChange: (value) => {
                    if (filter.value === undefined) setValues((current) => ({...current, [filter.name]: {type: "select", value}}));
                    filter.onChange?.(value);
                },
            });
        } else {
            const value = filter.value !== undefined ? filter.value
                : stored !== undefined ? stored as [Dayjs, Dayjs] | null : filter.defaultValue ?? null;
            const [start, end] = filter.fields || [`${filter.name}_start`, `${filter.name}_end`];
            Object.assign(params, filter.transform ? filter.transform(value) : {
                [start]: value?.[0].startOf("day").format("YYYY-MM-DD HH:mm:ss") || "",
                [end]: value?.[1].endOf("day").format("YYYY-MM-DD HH:mm:ss") || "",
            });
            items.push({
                type: "date", key: `filter:${filter.name}`, hidden: filter.hidden,
                value, ariaLabel: filter.label, disabled: filter.disabled, presets: filter.presets,
                tooltip: filter.tooltip,
                onChange: (value) => {
                    if (filter.value === undefined) setValues((current) => ({...current, [filter.name]: {type: "date", value}}));
                    filter.onChange?.(value);
                },
            });
        }
    });

    return {
        items,
        params,
        reset: () => {
            const next: FilterState = {};
            filters?.forEach((filter) => {
                if (filter.type === "select") {
                    const value = filter.defaultValue ?? (filter.allLabel === false
                        ? (filter.options ? filter.options[0]?.value : Object.keys(filter.valueEnum || {})[0]) ?? "" : "");
                    next[filter.name] = {type: "select", value: filter.defaultValue};
                    filter.onChange?.(value);
                } else {
                    const value = filter.defaultValue ?? null;
                    next[filter.name] = {type: "date", value};
                    filter.onChange?.(value);
                }
            });
            setValues(next);
        },
    };
}

// ============ PageTable ============
type ScrollPosition = {
    element: HTMLElement;
    left: number;
    top: number;
    stickToEnd: boolean;
};

type PaginationScrollSnapshot = {
    positions: ScrollPosition[];
    data: unknown;
};

const collectScrollPositions = (root: HTMLElement | null): ScrollPosition[] => {
    if (!root) return [];
    const scrollingElement = document.scrollingElement;
    const elements = new Set<HTMLElement>();
    if (scrollingElement) elements.add(scrollingElement as HTMLElement);
    const modal = root.closest<HTMLElement>(".ant-modal-wrap");
    if (modal) elements.add(modal);
    const dataPanel = root.querySelector<HTMLElement>(".ui-table-data");
    if (dataPanel) elements.add(dataPanel);
    for (let parent = root.parentElement; parent; parent = parent.parentElement) {
        const style = window.getComputedStyle(parent);
        if (parent.scrollHeight > parent.clientHeight && ["auto", "scroll", "overlay"].includes(style.overflowY)) {
            elements.add(parent);
        }
    }
    return [...elements].map((element) => {
        const maxTop = Math.max(0, element.scrollHeight - element.clientHeight);
        return {
            element,
            left: element.scrollLeft,
            top: element.scrollTop,
            stickToEnd: maxTop > 0 && maxTop - element.scrollTop <= 8,
        };
    });
};

const restoreScrollPositions = (positions: ScrollPosition[]) => {
    positions.forEach(({element, left, top, stickToEnd}) => {
        if (!element.isConnected) return;
        const maxTop = Math.max(0, element.scrollHeight - element.clientHeight);
        element.scrollLeft = left;
        element.scrollTop = stickToEnd ? maxTop : Math.min(top, maxTop);
    });
};

const PageTable = <RecordType extends object = any>(props: PageTableProps<RecordType>, ref: React.ForwardedRef<PageTableRef<RecordType>>) => {
    const {
        hero, toolbar, search, filters, contentBar, rowSelection, pagination, scrollToTopOnPageChange = false, paginationAffix = false, ariaLabel, rootClassName = "", rootStyle, empty, emptyContent,
        tableRender, request, params, defaultPage, defaultPageSize, defaultSort, manualRequest, requestEnabled,
        onLoad, onRequestError, onReload, onSortChange, dataSource, loading, rowKey = "id", ...tableProps
    } = props;
    const {styles} = useTableStyles();
    const rootRef = useRef<HTMLDivElement>(null);
    const paginationScrollRef = useRef<PaginationScrollSnapshot | null>(null);
    const searchConfig: TableSearchConfig | undefined = search === false ? undefined : search === true ? {} : search ?? (toolbar ? toolbar.search : undefined);
    const filter = useTableFilters(filters);
    const data = useTableData({...props, search: searchConfig, params: {...params, ...filter.params}});
    const selection = useTableSelection(data.data, rowKey, rowSelection);
    const selectedKeys = selection.keys;
    const scrollToTop = useCallback(() => {
        const panel = rootRef.current?.querySelector<HTMLElement>(".ui-table-data");
        panel?.scrollTo({top: 0});
        const modal = rootRef.current?.closest(".ant-modal-wrap");
        if (modal) modal.scrollTo({top: 0});
        else rootRef.current?.scrollIntoView({block: "start", inline: "nearest"});
    }, []);
    const [keyword, setKeyword] = useState(searchConfig?.defaultValue || "");
    const [paginationAffixed, setPaginationAffixed] = useState(false);
    const affixProps = typeof paginationAffix === "object" ? paginationAffix : undefined;
    const searchValue = searchConfig?.value ?? keyword;
    const submittedSearch = useRef(searchValue);
    const searchTimer = useRef<number | undefined>(undefined);
    const searchCallback = useRef((value: string) => {});
    searchCallback.current = (value) => {
        window.clearTimeout(searchTimer.current);
        submittedSearch.current = value;
        data.search(value);
        searchConfig?.onSearch?.(value, data.searchName);
    };
    useEffect(() => {
        if (!searchConfig || searchConfig.debounce === undefined || requestEnabled === false || submittedSearch.current === searchValue) return;
        searchTimer.current = window.setTimeout(() => searchCallback.current(searchValue), searchConfig.debounce);
        return () => window.clearTimeout(searchTimer.current);
    }, [searchValue, searchConfig?.debounce, requestEnabled]);

    useImperativeHandle(ref, () => ({
        reload: data.reload,
        refreshTableData: data.reload,
        resetTableData: () => {
            window.clearTimeout(searchTimer.current);
            const keyword = searchConfig?.defaultValue || "";
            submittedSearch.current = keyword;
            if (searchConfig?.value === undefined) setKeyword(keyword);
            searchConfig?.onChange?.(keyword);
            const field = searchConfig?.fields?.find((field) => field.value === searchConfig.defaultField)?.value || searchConfig?.fields?.[0]?.value;
            if (field) searchConfig?.onFieldChange?.(field);
            filter.reset();
            selection.clear();
            data.reset();
            scrollToTop();
        },
        getTableData: () => data.data,
        getSelectedRowKeys: selection.getKeys,
        getSelectedRows: selection.getRows,
        setSelectedRowKeys: selection.setKeys,
        clearSelectedRows: selection.clear,
        allSelectedRow: selection.selectAll,
        invertSelectedRow: selection.invert,
        scrollToTop,
    }));

    const selectionAction = <TableSelectionAction count={selectedKeys.length} items={selection.actions}
        onClear={selection.clear} clearDisabled={selection.clearDisabled}/>;
    const content = contentBar ? contentBar.content : undefined;
    const hasContent = content !== undefined && content !== null && content !== false;
    const hasContentActions = Boolean(contentBar && contentBar.actions?.some((item) => !item.hidden));
    const toolbarActions = [...filter.items, ...(toolbar ? toolbar.actions || [] : []), ...(!hasContent && contentBar ? contentBar.actions || [] : [])];
    const refresh = toolbar === false ? false : toolbar?.refresh ?? Boolean(request);
    const showToolbar = toolbar !== false && Boolean(toolbar || searchConfig || toolbarActions.length || refresh || (!hasContent && selectedKeys.length));
    const showEmpty = empty ?? data.data.length === 0;
    const spinning = typeof data.loading === "boolean" ? data.loading : Boolean(data.loading?.spinning);
    const changePage = useCallback((page: number, pageSize: number) => {
        if (scrollToTopOnPageChange) {
            paginationScrollRef.current = null;
            data.changePage(page, pageSize);
            scrollToTop();
            return;
        }
        paginationScrollRef.current = {
            positions: collectScrollPositions(rootRef.current),
            data: data.data,
        };
        data.changePage(page, pageSize);
    }, [data.changePage, data.data, scrollToTop, scrollToTopOnPageChange]);

    useLayoutEffect(() => {
        const snapshot = paginationScrollRef.current;
        if (!snapshot) return;
        restoreScrollPositions(snapshot.positions);
        let secondFrame = 0;
        const firstFrame = window.requestAnimationFrame(() => {
            restoreScrollPositions(snapshot.positions);
            secondFrame = window.requestAnimationFrame(() => restoreScrollPositions(snapshot.positions));
        });
        const timeout = window.setTimeout(() => {
            if (paginationScrollRef.current === snapshot) paginationScrollRef.current = null;
        }, 1200);
        if (data.data !== snapshot.data) paginationScrollRef.current = null;
        return () => {
            window.cancelAnimationFrame(firstFrame);
            window.cancelAnimationFrame(secondFrame);
            window.clearTimeout(timeout);
        };
    }, [data.data, data.loading, data.page, data.pageSize]);
    const columns = useMemo(() => {
        if (!request || !tableProps.columns) return tableProps.columns;
        const sortColumns = (items: NonNullable<typeof tableProps.columns>): typeof items => items.map((column) => {
            if ("children" in column) return {...column, children: sortColumns(column.children)};
            if (!column.sorter || column.sortOrder !== undefined) return column;
            const field = Array.isArray(column.dataIndex) ? column.dataIndex.join(".") : column.dataIndex ?? column.key;
            return {...column, sortOrder: data.sort[String(field)] || null};
        });
        return sortColumns(tableProps.columns);
    }, [Boolean(request), tableProps.columns, data.sort]);
    const table = showEmpty ? <div className={styles.state} role="status">
        {spinning ? <Spin/> : emptyContent ?? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据"/>}
    </div> : <DataTable<RecordType> {...tableProps} columns={columns} dataSource={data.data} loading={data.loading}
                            rowKey={rowKey} rowSelection={selection.rowSelection} onSortChange={data.changeSort}/>;
    const paginationContent = pagination !== false && data.total > 0 ? (
        <nav className="ui-table-pagination" aria-label="表格分页">
            <TablePagination {...pagination} affixed={paginationAffix && paginationAffixed} page={data.page} pageSize={data.pageSize} total={data.total}
                             disabled={pagination?.disabled ?? spinning}
                             onChange={changePage}/>
        </nav>
    ) : null;

    return (
        <div ref={rootRef} className={`${styles.page} ui-table-root ${rootClassName}`} style={rootStyle}>
            <section className={`${styles.workspace} ui-table-workspace`} aria-label={ariaLabel}>
                {hero && <TableHero {...hero}/>}
                {showToolbar && <TableToolbar
                    left={toolbar ? toolbar.left : undefined}
                    search={searchConfig ? {
                        ...searchConfig,
                        value: searchValue,
                        field: data.searchName,
                        placeholder: searchConfig.placeholder || "搜索",
                        onFieldChange: (field) => {
                            window.clearTimeout(searchTimer.current);
                            const maxLength = searchConfig.fields?.find((option) => option.value === field)?.maxLength ?? searchConfig.maxLength;
                            const value = maxLength === undefined ? searchValue : searchValue.slice(0, maxLength);
                            if (value !== searchValue) {
                                if (searchConfig.value === undefined) setKeyword(value);
                                searchConfig.onChange?.(value);
                            }
                            submittedSearch.current = value;
                            data.search(value, field);
                            searchConfig.onFieldChange?.(field);
                            if (value.trim()) searchConfig.onSearch?.(value, field);
                        },
                        onChange: (value) => {
                            if (searchConfig.value === undefined) setKeyword(value);
                            searchConfig.onChange?.(value);
                            if (!value.trim()) {
                                window.clearTimeout(searchTimer.current);
                                if (submittedSearch.current.trim()) searchCallback.current(value);
                                else submittedSearch.current = value;
                            }
                        },
                        onSearch: (value) => searchCallback.current(value),
                        onBlur: (value) => {
                            window.clearTimeout(searchTimer.current);
                            if (value.trim() !== submittedSearch.current.trim()) searchCallback.current(value);
                            else submittedSearch.current = value;
                            searchConfig.onBlur?.(value);
                        },
                    } : undefined}
                    refresh={refresh ? {loading: spinning, onClick: data.reload, ...(refresh === true ? {} : refresh)} : undefined}
                    extra={!hasContent && selectedKeys.length > 0 ? selectionAction : undefined}>
                    <TableCommands items={toolbarActions}/>
                </TableToolbar>}
                {hasContent && contentBar && <div className={`${styles.contentBar} ui-table-content-bar`} role="group" aria-label={contentBar.ariaLabel || "表格内容与操作"}>
                    <div className="table-bar-content">{content}</div>
                    {(selectedKeys.length > 0 || hasContentActions) && <div className="table-bar-actions">
                        {hasContentActions && <div className="table-bar-actions-scroll"><TableCommands items={contentBar.actions}/></div>}
                        {selectionAction}
                    </div>}
                </div>}
                <div className={`${styles.dataPanel} ui-table-data`}>
                    {tableRender ? tableRender(table) : table}
                </div>
            </section>
            {paginationContent && (paginationAffix ? (
                <Affix {...affixProps}
                    offsetBottom={affixProps?.offsetBottom ?? (affixProps?.offsetTop === undefined ? 0 : undefined)}
                    onChange={(affixed) => {
                        setPaginationAffixed(Boolean(affixed));
                        affixProps?.onChange?.(affixed);
                    }}>
                    {paginationContent}
                </Affix>
            ) : paginationContent)}
        </div>
    );
};

export default forwardRef(PageTable) as <RecordType extends object = any>(props: PageTableProps<RecordType> & React.RefAttributes<PageTableRef<RecordType>>) => React.ReactElement;
