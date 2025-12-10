import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
  en: {
    translation: {
      // Navigation
      'nav.skipToContent': 'Skip to main content',
      'nav.skipToNavigation': 'Skip to navigation',

      // Tabs
      'tab.userLevel': 'User Level',
      'tab.projectLevel': 'Project Level',
      'tab.current': 'Current Scope',
      'tab.overview': 'Overview',

      // Buttons
      'button.save': 'Save',
      'button.cancel': 'Cancel',
      'button.delete': 'Delete',
      'button.edit': 'Edit',
      'button.refresh': 'Refresh',
      'button.export': 'Export',
      'button.import': 'Import',
      'button.language': 'Language',
      'button.theme': 'Theme',
      'button.zoomIn': 'Zoom In',
      'button.zoomOut': 'Zoom Out',
      'button.resetZoom': 'Reset Zoom',
      'button.highContrast': 'High Contrast Mode',

      // Labels
      'label.projectName': 'Project Name',
      'label.projectPath': 'Project Path',
      'label.configType': 'Configuration Type',
      'label.lastModified': 'Last Modified',
      'label.fileSize': 'File Size',

      // Messages
      'message.loading': 'Loading...',
      'message.error': 'Error',
      'message.success': 'Success',
      'message.noData': 'No data available',
      'message.selectProject': 'Select a project to view details',

      // Status
      'status.readonly': 'Read Only',
      'status.modified': 'Modified',
      'status.new': 'New',
      'status.deleted': 'Deleted',

      // Menu Items
      'menu.file': 'File',
      'menu.edit': 'Edit',
      'menu.view': 'View',
      'menu.tools': 'Tools',
      'menu.help': 'Help',

      // Dialogs
      'dialog.confirmDelete': 'Confirm Delete',
      'dialog.deleteMessage': 'Are you sure you want to delete this item?',
      'dialog.confirm': 'Confirm',
      'dialog.dismiss': 'Dismiss',

      // Accessibility
      'a11y.status': 'Status',
      'a11y.alert': 'Alert',
      'a11y.liveregion': 'Live Region',
      'a11y.expanded': 'Expanded',
      'a11y.collapsed': 'Collapsed',
      'a11y.selected': 'Selected',
      'a11y.notSelected': 'Not Selected',
      'a11y.activeTab': 'Active Tab',
      'a11y.inactiveTab': 'Inactive Tab',

      // Form
      'form.search': 'Search',
      'form.searchPlaceholder': 'Search configurations...',
      'form.filter': 'Filter',
      'form.sort': 'Sort',

      // General
      'general.back': 'Back',
      'general.next': 'Next',
      'general.previous': 'Previous',
      'general.close': 'Close',
      'general.open': 'Open',
      'general.home': 'Home',
    },
  },
  zh: {
    translation: {
      // Navigation
      'nav.skipToContent': '跳转到主内容',
      'nav.skipToNavigation': '跳转到导航',

      // Tabs
      'tab.userLevel': '用户级别',
      'tab.projectLevel': '项目级别',
      'tab.current': '当前范围',
      'tab.overview': '概览',

      // Buttons
      'button.save': '保存',
      'button.cancel': '取消',
      'button.delete': '删除',
      'button.edit': '编辑',
      'button.refresh': '刷新',
      'button.export': '导出',
      'button.import': '导入',
      'button.language': '语言',
      'button.theme': '主题',
      'button.zoomIn': '放大',
      'button.zoomOut': '缩小',
      'button.resetZoom': '重置缩放',
      'button.highContrast': '高对比度模式',

      // Labels
      'label.projectName': '项目名称',
      'label.projectPath': '项目路径',
      'label.configType': '配置类型',
      'label.lastModified': '最后修改',
      'label.fileSize': '文件大小',

      // Messages
      'message.loading': '加载中...',
      'message.error': '错误',
      'message.success': '成功',
      'message.noData': '没有可用数据',
      'message.selectProject': '选择项目查看详情',

      // Status
      'status.readonly': '只读',
      'status.modified': '已修改',
      'status.new': '新建',
      'status.deleted': '已删除',

      // Menu Items
      'menu.file': '文件',
      'menu.edit': '编辑',
      'menu.view': '查看',
      'menu.tools': '工具',
      'menu.help': '帮助',

      // Dialogs
      'dialog.confirmDelete': '确认删除',
      'dialog.deleteMessage': '确定要删除此项吗？',
      'dialog.confirm': '确认',
      'dialog.dismiss': '取消',

      // Accessibility
      'a11y.status': '状态',
      'a11y.alert': '警告',
      'a11y.liveregion': '实时区域',
      'a11y.expanded': '已展开',
      'a11y.collapsed': '已折叠',
      'a11y.selected': '已选择',
      'a11y.notSelected': '未选择',
      'a11y.activeTab': '活动标签页',
      'a11y.inactiveTab': '非活动标签页',

      // Form
      'form.search': '搜索',
      'form.searchPlaceholder': '搜索配置...',
      'form.filter': '筛选',
      'form.sort': '排序',

      // General
      'general.back': '返回',
      'general.next': '下一步',
      'general.previous': '上一步',
      'general.close': '关闭',
      'general.open': '打开',
      'general.home': '首页',
    },
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
    },
  })

export default i18n
