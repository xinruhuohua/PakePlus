// settingsData.js - 设置项数据模块
export const settings = [
    { icon: 'fas fa-palette', title: '渲染设置', desc: '调整材质质量、阴影效果和后期处理，优化视觉体验', id: 'render', options: [ { label: '高质量', value: 'high' }, { label: '标准', value: 'medium' }, { label: '性能优先', value: 'low' } ], value: 'high' },
    { icon: 'fas fa-gamepad', title: '控制设置', desc: '自定义旋转、缩放和平移的灵敏度，符合您的操作习惯', id: 'control', options: [ { label: '灵敏', value: 'fast' }, { label: '标准', value: 'normal' }, { label: '缓慢', value: 'slow' } ], value: 'normal' },
    { icon: 'fas fa-lightbulb', title: '灯光设置', desc: '调整环境光、点光源和方向光源，突出模型细节', id: 'light', options: [ { label: '明亮', value: 'bright' }, { label: '标准', value: 'normal' }, { label: '柔和', value: 'soft' } ], value: 'normal' },
    { icon: 'fas fa-vr-cardboard', title: 'VR支持', desc: '配置虚拟现实设备参数，启用沉浸式体验', id: 'vr', options: [ { label: '启用', value: 'on' }, { label: '关闭', value: 'off' } ], value: 'off' }
];
