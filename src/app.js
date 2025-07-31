// app.js - 3D模型交互展示平台主逻辑

// 引入模型库和设置项数据（需支持ESM或用window.models/settings）
import { models } from './modelData.js';
import { settings } from './settingsData.js';

// 加载动画与错误提示（UI优化）
function showLoader(msg = '加载中...') {
    let loader = document.getElementById('loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loader';
        loader.className = 'loader';
        loader.innerHTML = '<div class="loader-spinner"></div><div class="loader-text"></div>';
        document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
    loader.querySelector('.loader-text').textContent = msg;
}
function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
}
function showError(msg) {
    let errBox = document.getElementById('error-tip');
    if (!errBox) {
        errBox = document.createElement('div');
        errBox.id = 'error-tip';
        errBox.style.position = 'fixed';
        errBox.style.left = '50%';
        errBox.style.bottom = '40px';
        errBox.style.transform = 'translateX(-50%)';
        errBox.style.background = 'rgba(220,40,40,0.95)';
        errBox.style.color = '#fff';
        errBox.style.padding = '14px 32px';
        errBox.style.borderRadius = '30px';
        errBox.style.fontSize = '1.1rem';
        errBox.style.zIndex = '9999';
        errBox.style.boxShadow = '0 2px 12px rgba(0,0,0,0.2)';
        document.body.appendChild(errBox);
    }
    errBox.textContent = msg;
    errBox.style.opacity = '1';
    setTimeout(()=>{ errBox.style.opacity = '0'; }, 2500);
}

// 测量工具模块
class MeasureTool {
    constructor(scene, camera, dom) {
        this.scene = scene;
        this.camera = camera;
        this.dom = dom;
        this.points = [];
        this.lines = [];
        this.spheres = [];
        this.active = false;
        this.panel = null;
        this._bindEvents();
    }
    _bindEvents() {
        this.dom.addEventListener('click', this._onClick.bind(this));
    }
    _onClick(e) {
        if (!this.active) return;
        const rect = this.dom.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObjects(this.scene.children, true);
        if (intersects.length > 0) {
            const pt = intersects[0].point.clone();
            this.points.push(pt);
            this._drawPoint(pt);
            if (this.points.length >= 2) {
                this._drawLine(this.points[this.points.length-2], this.points[this.points.length-1]);
                const dist = this.points[this.points.length-2].distanceTo(this.points[this.points.length-1]);
                this._showPanel(dist);
            }
        }
    }
    _drawPoint(pt) {
        const geo = new THREE.SphereGeometry(0.05, 16, 16);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffa500 });
        const sphere = new THREE.Mesh(geo, mat);
        sphere.position.copy(pt);
        this.scene.add(sphere);
        this.spheres.push(sphere);
    }
    _drawLine(p1, p2) {
        const geometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
        const material = new THREE.LineBasicMaterial({ color: 0xffa500 });
        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
        this.lines.push(line);
        setTimeout(()=>{ this.scene.remove(line); }, 4000);
    }
    _showPanel(dist) {
        if (!this.panel) {
            this.panel = document.createElement('div');
            this.panel.className = 'measure-panel';
            this.panel.style.position = 'fixed';
            this.panel.style.left = '50%';
            this.panel.style.bottom = '80px';
            this.panel.style.transform = 'translateX(-50%)';
            this.panel.style.background = 'rgba(30,30,40,0.95)';
            this.panel.style.color = '#fff';
            this.panel.style.padding = '12px 28px';
            this.panel.style.borderRadius = '20px';
            this.panel.style.fontSize = '1.1rem';
            this.panel.style.zIndex = '9999';
            this.panel.style.boxShadow = '0 2px 12px rgba(0,0,0,0.2)';
            document.body.appendChild(this.panel);
        }
        this.panel.textContent = '测量距离: ' + (dist*1000).toFixed(2) + ' mm';
        this.panel.style.opacity = '1';
        setTimeout(()=>{ if(this.panel) this.panel.style.opacity = '0'; }, 3500);
    }
    setActive(val) {
        this.active = val;
        if (!val) {
            this.points = [];
            this.spheres.forEach(s=>this.scene.remove(s));
            this.spheres = [];
        }
    }
}

// 导出工具模块（基础结构）
class ExportTool {
    constructor(scene) { this.scene = scene; }
    async exportGLB(object) {
        // 动态加载GLTFExporter（仅加载一次）
        if (!THREE.GLTFExporter) {
            showLoader('加载GLTF导出器...');
            await import('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/exporters/GLTFExporter.min.js');
            hideLoader();
        }
        if (!THREE.GLTFExporter) {
            showError('GLTFExporter 加载失败');
            return;
        }
        const exporter = new THREE.GLTFExporter();
        exporter.parse(object, glb => {
            const blob = new Blob([glb], {type: 'model/gltf-binary'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'model.glb';
            a.click();
            setTimeout(()=>URL.revokeObjectURL(url), 2000);
        }, {binary: true});
    }
    exportPNG(renderer, camera) {
        renderer.render(renderer.scene, camera);
        const url = renderer.domElement.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url; a.download = 'screenshot.png';
        a.click();
    }
    exportSTL() { showError('STL导出功能待实现'); }
}

// 材质编辑器模块（基础结构）
class MaterialEditor {
    constructor() { this.panel = null; }
    edit(material) {
        if (!this.panel) {
            this.panel = document.createElement('div');
            this.panel.className = 'mat-panel';
            this.panel.style.position = 'fixed';
            this.panel.style.left = '50%';
            this.panel.style.top = '50%';
            this.panel.style.transform = 'translate(-50%,-50%)';
            this.panel.style.background = 'rgba(30,30,40,0.98)';
            this.panel.style.color = '#fff';
            this.panel.style.padding = '28px 36px';
            this.panel.style.borderRadius = '18px';
            this.panel.style.fontSize = '1.1rem';
            this.panel.style.zIndex = '9999';
            this.panel.style.boxShadow = '0 2px 12px rgba(0,0,0,0.2)';
            this.panel.innerHTML = `
                <div style="margin-bottom:18px;font-size:1.2rem;font-weight:bold;">材质编辑</div>
                <div style="margin-bottom:10px;">
                  <label>颜色 <input type="color" id="mat-color"></label>
                  <label style="margin-left:18px;">透明度 <input type="range" id="mat-opacity" min="0" max="1" step="0.01" style="width:80px;"></label>
                  <span id="mat-opacity-val"></span>
                </div>
                <div style="margin-bottom:10px;">
                  <label>金属度 <input type="range" id="mat-metal" min="0" max="1" step="0.01" style="width:80px;"></label>
                  <span id="mat-metal-val"></span>
                  <label style="margin-left:18px;">粗糙度 <input type="range" id="mat-rough" min="0" max="1" step="0.01" style="width:80px;"></label>
                  <span id="mat-rough-val"></span>
                </div>
                <div style="margin-bottom:10px;">
                  <label><input type="checkbox" id="mat-double"> 双面</label>
                  <label style="margin-left:18px;"><input type="checkbox" id="mat-metallic"> 金属材质</label>
                </div>
                <div style="margin-bottom:10px;">
                  <label>主贴图 <input type="file" id="mat-map" accept="image/*" style="width:120px;"></label>
                  <button id="mat-remove-map" style="margin-left:10px;">移除</button>
                  <span id="mat-map-preview"></span>
                </div>
                <div style="margin-bottom:10px;">
                  <label>法线贴图 <input type="file" id="mat-normal" accept="image/*" style="width:120px;"></label>
                  <button id="mat-remove-normal" style="margin-left:10px;">移除</button>
                  <span id="mat-normal-preview"></span>
                </div>
                <div style="margin-bottom:10px;">
                  <label>粗糙度贴图 <input type="file" id="mat-roughmap" accept="image/*" style="width:120px;"></label>
                  <button id="mat-remove-rough" style="margin-left:10px;">移除</button>
                  <span id="mat-rough-preview"></span>
                </div>
                <div style="margin-bottom:10px;">
                  <label>金属度贴图 <input type="file" id="mat-metalmap" accept="image/*" style="width:120px;"></label>
                  <button id="mat-remove-metal" style="margin-left:10px;">移除</button>
                  <span id="mat-metal-preview"></span>
                </div>
                <div style="margin-bottom:10px;">
                  <label>AO贴图 <input type="file" id="mat-ao" accept="image/*" style="width:120px;"></label>
                  <button id="mat-remove-ao" style="margin-left:10px;">移除</button>
                  <span id="mat-ao-preview"></span>
                </div>
                <div style="margin-bottom:10px;">
                  <label>位移贴图 <input type="file" id="mat-displace" accept="image/*" style="width:120px;"></label>
                  <button id="mat-remove-displace" style="margin-left:10px;">移除</button>
                  <span id="mat-displace-preview"></span>
                </div>
                <div style="margin-bottom:10px;">
                  <label>环境贴图 <input type="file" id="mat-env" accept="image/*" style="width:120px;"></label>
                  <button id="mat-remove-env" style="margin-left:10px;">移除</button>
                  <span id="mat-env-preview"></span>
                </div>
                <button id="mat-close" style="margin-top:10px;">关闭</button>
            `;
            document.body.appendChild(this.panel);
        }
        this.panel.style.display = 'block';
        // 初始化
        this.panel.querySelector('#mat-color').value = '#'+material.color.getHexString();
        this.panel.querySelector('#mat-metal').value = material.metalness ?? 0;
        this.panel.querySelector('#mat-metal-val').textContent = material.metalness ?? 0;
        this.panel.querySelector('#mat-rough').value = material.roughness ?? 0.5;
        this.panel.querySelector('#mat-rough-val').textContent = material.roughness ?? 0.5;
        this.panel.querySelector('#mat-opacity').value = material.opacity ?? 1;
        this.panel.querySelector('#mat-opacity-val').textContent = material.opacity ?? 1;
        this.panel.querySelector('#mat-double').checked = material.side === THREE.DoubleSide;
        this.panel.querySelector('#mat-metallic').checked = (material.metalness ?? 0) > 0.5;
        // 主贴图预览
        const mapPreview = this.panel.querySelector('#mat-map-preview');
        if(material.map && material.map.image) {
            mapPreview.innerHTML = `<img src="${material.map.image.src}" style="max-width:60px;max-height:30px;border-radius:4px;">`;
        } else {
            mapPreview.innerHTML = '<span style="color:#888;">无</span>';
        }
        // 法线贴图预览
        const normalPreview = this.panel.querySelector('#mat-normal-preview');
        if(material.normalMap && material.normalMap.image) {
            normalPreview.innerHTML = `<img src="${material.normalMap.image.src}" style="max-width:60px;max-height:30px;border-radius:4px;">`;
        } else {
            normalPreview.innerHTML = '<span style="color:#888;">无</span>';
        }
        // 粗糙度贴图预览
        const roughPreview = this.panel.querySelector('#mat-rough-preview');
        if(material.roughnessMap && material.roughnessMap.image) {
            roughPreview.innerHTML = `<img src="${material.roughnessMap.image.src}" style="max-width:60px;max-height:30px;border-radius:4px;">`;
        } else {
            roughPreview.innerHTML = '<span style="color:#888;">无</span>';
        }
        // 金属度贴图预览
        const metalPreview = this.panel.querySelector('#mat-metal-preview');
        if(material.metalnessMap && material.metalnessMap.image) {
            metalPreview.innerHTML = `<img src="${material.metalnessMap.image.src}" style="max-width:60px;max-height:30px;border-radius:4px;">`;
        } else {
            metalPreview.innerHTML = '<span style="color:#888;">无</span>';
        }
        // AO贴图预览
        const aoPreview = this.panel.querySelector('#mat-ao-preview');
        if(material.aoMap && material.aoMap.image) {
            aoPreview.innerHTML = `<img src="${material.aoMap.image.src}" style="max-width:60px;max-height:30px;border-radius:4px;">`;
        } else {
            aoPreview.innerHTML = '<span style="color:#888;">无</span>';
        }
        // 位移贴图预览
        const displacePreview = this.panel.querySelector('#mat-displace-preview');
        if(material.displacementMap && material.displacementMap.image) {
            displacePreview.innerHTML = `<img src="${material.displacementMap.image.src}" style="max-width:60px;max-height:30px;border-radius:4px;">`;
        } else {
            displacePreview.innerHTML = '<span style="color:#888;">无</span>';
        }
        // 环境贴图预览
        const envPreview = this.panel.querySelector('#mat-env-preview');
        if(material.envMap && material.envMap.image) {
            envPreview.innerHTML = `<img src="${material.envMap.image.src}" style="max-width:60px;max-height:30px;border-radius:4px;">`;
        } else {
            envPreview.innerHTML = '<span style="color:#888;">无</span>';
        }
        // 事件
        this.panel.querySelector('#mat-color').oninput = e => {
            material.color.set(e.target.value);
        };
        this.panel.querySelector('#mat-metal').oninput = e => {
            material.metalness = parseFloat(e.target.value);
            this.panel.querySelector('#mat-metal-val').textContent = material.metalness;
        };
        this.panel.querySelector('#mat-rough').oninput = e => {
            material.roughness = parseFloat(e.target.value);
            this.panel.querySelector('#mat-rough-val').textContent = material.roughness;
        };
        this.panel.querySelector('#mat-opacity').oninput = e => {
            material.opacity = parseFloat(e.target.value);
            material.transparent = material.opacity < 1;
            this.panel.querySelector('#mat-opacity-val').textContent = material.opacity;
        };
        this.panel.querySelector('#mat-double').onchange = e => {
            material.side = e.target.checked ? THREE.DoubleSide : THREE.FrontSide;
            material.needsUpdate = true;
        };
        this.panel.querySelector('#mat-metallic').onchange = e => {
            material.metalness = e.target.checked ? 1 : 0;
            this.panel.querySelector('#mat-metal').value = material.metalness;
            this.panel.querySelector('#mat-metal-val').textContent = material.metalness;
        };
        // 主贴图上传
        this.panel.querySelector('#mat-map').onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            const tex = new THREE.TextureLoader().load(url, () => {
                material.map = tex;
                material.needsUpdate = true;
                mapPreview.innerHTML = `<img src="${url}" style="max-width:60px;max-height:30px;border-radius:4px;">`;
            });
        };
        // 主贴图移除
        this.panel.querySelector('#mat-remove-map').onclick = () => {
            if(material.map) {
                material.map.dispose?.();
                material.map = null;
                material.needsUpdate = true;
                mapPreview.innerHTML = '<span style="color:#888;">无</span>';
            }
        };
        // 法线贴图上传
        this.panel.querySelector('#mat-normal').onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            const tex = new THREE.TextureLoader().load(url, () => {
                material.normalMap = tex;
                material.needsUpdate = true;
                normalPreview.innerHTML = `<img src="${url}" style="max-width:60px;max-height:30px;border-radius:4px;">`;
            });
        };
        // 法线贴图移除
        this.panel.querySelector('#mat-remove-normal').onclick = () => {
            if(material.normalMap) {
                material.normalMap.dispose?.();
                material.normalMap = null;
                material.needsUpdate = true;
                normalPreview.innerHTML = '<span style="color:#888;">无</span>';
            }
        };
        // 粗糙度贴图上传
        this.panel.querySelector('#mat-roughmap').onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            const tex = new THREE.TextureLoader().load(url, () => {
                material.roughnessMap = tex;
                material.needsUpdate = true;
                roughPreview.innerHTML = `<img src="${url}" style="max-width:60px;max-height:30px;border-radius:4px;">`;
            });
        };
        // 粗糙度贴图移除
        this.panel.querySelector('#mat-remove-rough').onclick = () => {
            if(material.roughnessMap) {
                material.roughnessMap.dispose?.();
                material.roughnessMap = null;
                material.needsUpdate = true;
                roughPreview.innerHTML = '<span style="color:#888;">无</span>';
            }
        };
        // 金属度贴图上传
        this.panel.querySelector('#mat-metalmap').onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            const tex = new THREE.TextureLoader().load(url, () => {
                material.metalnessMap = tex;
                material.needsUpdate = true;
                metalPreview.innerHTML = `<img src="${url}" style="max-width:60px;max-height:30px;border-radius:4px;">`;
            });
        };
        // 金属度贴图移除
        this.panel.querySelector('#mat-remove-metal').onclick = () => {
            if(material.metalnessMap) {
                material.metalnessMap.dispose?.();
                material.metalnessMap = null;
                material.needsUpdate = true;
                metalPreview.innerHTML = '<span style="color:#888;">无</span>';
            }
        };
        // AO贴图上传
        this.panel.querySelector('#mat-ao').onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            const tex = new THREE.TextureLoader().load(url, () => {
                material.aoMap = tex;
                material.needsUpdate = true;
                aoPreview.innerHTML = `<img src="${url}" style="max-width:60px;max-height:30px;border-radius:4px;">`;
            });
        };
        // AO贴图移除
        this.panel.querySelector('#mat-remove-ao').onclick = () => {
            if(material.aoMap) {
                material.aoMap.dispose?.();
                material.aoMap = null;
                material.needsUpdate = true;
                aoPreview.innerHTML = '<span style="color:#888;">无</span>';
            }
        };
        // 位移贴图上传
        this.panel.querySelector('#mat-displace').onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            const tex = new THREE.TextureLoader().load(url, () => {
                material.displacementMap = tex;
                material.needsUpdate = true;
                displacePreview.innerHTML = `<img src="${url}" style="max-width:60px;max-height:30px;border-radius:4px;">`;
            });
        };
        // 位移贴图移除
        this.panel.querySelector('#mat-remove-displace').onclick = () => {
            if(material.displacementMap) {
                material.displacementMap.dispose?.();
                material.displacementMap = null;
                material.needsUpdate = true;
                displacePreview.innerHTML = '<span style="color:#888;">无</span>';
            }
        };
        // 环境贴图上传
        this.panel.querySelector('#mat-env').onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            const tex = new THREE.TextureLoader().load(url, () => {
                material.envMap = tex;
                material.needsUpdate = true;
                envPreview.innerHTML = `<img src="${url}" style="max-width:60px;max-height:30px;border-radius:4px;">`;
            });
        };
        // 环境贴图移除
        this.panel.querySelector('#mat-remove-env').onclick = () => {
            if(material.envMap) {
                material.envMap.dispose?.();
                material.envMap = null;
                material.needsUpdate = true;
                envPreview.innerHTML = '<span style="color:#888;">无</span>';
            }
        };
        this.panel.querySelector('#mat-close').onclick = () => {
            this.panel.style.display = 'none';
        };
    }
}

// 页面切换
window.showPage = function(pageId) {
    document.getElementById('start-page').style.display = 'none';
    document.getElementById('main-page').classList.remove('active');
    document.getElementById('settings-page').classList.remove('active');
    if (pageId) {
        document.getElementById(pageId).classList.add('active');
        if (pageId === 'main-page') {
            init3DScene();
        }
    }
};

// 工具栏切换
window.toggleToolbar = function() {
    const toolbar = document.getElementById('toolbar');
    toolbar.classList.toggle('active');
    const icon = toolbar.querySelector('.toolbar-toggle i');
    icon.className = toolbar.classList.contains('active') ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
};

// 渲染模型库
function renderModelList() {
    const list = document.getElementById('model-list');
    list.innerHTML = '';
    models.forEach((model, idx) => {
        const item = document.createElement('div');
        item.className = 'model-item' + (idx === 0 ? ' active' : '');
        item.dataset.modelPath = model.path;
        item.dataset.modelType = model.type;
        item.innerHTML = `
            <div class="model-icon"><i class="${model.icon}"></i></div>
            <div class="model-info">
                <h3>${model.name}</h3>
                <p>${model.desc}</p>
            </div>
        `;
        item.addEventListener('click', () => {
            document.querySelectorAll('.model-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            loadModel(model.path, model.type);
        });
        list.appendChild(item);
    });
}

// 渲染设置项
function renderSettings() {
    const grid = document.getElementById('settings-grid');
    grid.innerHTML = '';
    settings.forEach(setting => {
        const card = document.createElement('div');
        card.className = 'setting-card';
        card.innerHTML = `
            <div class="setting-icon"><i class="${setting.icon}"></i></div>
            <h3>${setting.title}</h3>
            <p>${setting.desc}</p>
            <div class="setting-options">
                ${setting.options.map(opt => `
                    <label style="margin-right:10px;">
                        <input type="radio" name="${setting.id}" value="${opt.value}" ${setting.value===opt.value?'checked':''}>
                        ${opt.label}
                    </label>
                `).join('')}
            </div>
        `;
        card.querySelectorAll('input[type=radio]').forEach(input => {
            input.addEventListener('change', e => {
                setting.value = e.target.value;
                applySettings();
            });
        });
        grid.appendChild(card);
    });
}

// 应用设置项到3D场景
function applySettings() {
    // 这里只做简单演示，实际可根据设置调整渲染参数、控制灵敏度、灯光等
    if(window._3dScene) {
        const { renderer, controls, scene, lights } = window._3dScene;
        // 渲染质量
        const renderSetting = settings.find(s=>s.id==='render').value;
        if(renderSetting==='high') renderer.setPixelRatio(window.devicePixelRatio);
        else if(renderSetting==='medium') renderer.setPixelRatio(1.2);
        else renderer.setPixelRatio(1);
        // 控制灵敏度
        const controlSetting = settings.find(s=>s.id==='control').value;
        controls.rotateSpeed = controlSetting==='fast'?1.5:controlSetting==='slow'?0.5:1.0;
        controls.zoomSpeed = controlSetting==='fast'?1.5:controlSetting==='slow'?0.5:1.0;
        // 灯光
        const lightSetting = settings.find(s=>s.id==='light').value;
        if(lights && lights.ambient) {
            lights.ambient.intensity = lightSetting==='bright'?1.0:lightSetting==='soft'?0.3:0.6;
        }
        if(lights && lights.directional) {
            lights.directional.intensity = lightSetting==='bright'?1.2:lightSetting==='soft'?0.5:0.8;
        }
    }
}

// 移动端适配：切换控制按钮布局和入口
function adaptMobileUI() {
    const isMobile = window.innerWidth < 768;
    document.body.classList.toggle('mobile-ui', isMobile);
    // 移动端专用入口按钮
    let mobileBar = document.getElementById('mobile-bar');
    if (!mobileBar) {
        mobileBar = document.createElement('div');
        mobileBar.id = 'mobile-bar';
        mobileBar.style.position = 'fixed';
        mobileBar.style.bottom = '0';
        mobileBar.style.left = '0';
        mobileBar.style.width = '100%';
        mobileBar.style.background = 'rgba(30,30,40,0.98)';
        mobileBar.style.display = 'flex';
        mobileBar.style.justifyContent = 'space-around';
        mobileBar.style.padding = '8px 0';
        mobileBar.style.zIndex = '9999';
        mobileBar.innerHTML = `
            <button id="m-measure" style="font-size:1.3rem;">测量</button>
            <button id="m-export" style="font-size:1.3rem;">导出PNG</button>
            <button id="m-mat" style="font-size:1.3rem;">材质</button>
        `;
        document.body.appendChild(mobileBar);
    }
    mobileBar.style.display = isMobile ? 'flex' : 'none';
    // 绑定事件
    document.getElementById('m-measure').onclick = () => {
        if(window._measureTool) window._measureTool.setActive(true);
    };
    document.getElementById('m-export').onclick = () => {
        if(window._exportTool && window._3dScene) window._exportTool.exportPNG(window._3dScene.renderer, window._3dScene.camera);
    };
    document.getElementById('m-mat').onclick = () => {
        if(window._materialEditor && window._3dScene && window._3dScene.scene.children.length>0) {
            // 取第一个Mesh材质
            let mesh = window._3dScene.scene.children.find(obj=>obj.isMesh);
            if(mesh) window._materialEditor.edit(mesh.material);
        }
    };
}
window.addEventListener('resize', adaptMobileUI);

// 初始化3D场景
function init3DScene() {
    const container = document.getElementById('model-container');
    while (container.firstChild) container.removeChild(container.firstChild);
    // 场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.Fog(0x0a0a1a, 20, 100);
    // 相机
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    // 渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    // 控制器
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    // 灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);
    // 地面
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, metalness: 0.2, roughness: 0.8 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    scene.add(ground);
    // 网格辅助
    const gridHelper = new THREE.GridHelper(20, 20, 0x444466, 0x222244);
    scene.add(gridHelper);
    // 坐标轴辅助
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
    // 当前模型对象
    let currentModel = null;
    // 工具模块实例
    const measureTool = new MeasureTool(scene, camera, renderer.domElement);
    const exportTool = new ExportTool(scene);
    const materialEditor = new MaterialEditor();
    window._measureTool = measureTool;
    window._exportTool = exportTool;
    window._materialEditor = materialEditor;
    // 支持多格式加载
    window.loadModel = function(path, type) {
        if(currentModel) {
            scene.remove(currentModel);
            if(currentModel.geometry) currentModel.geometry.dispose?.();
            if(currentModel.material) currentModel.material.dispose?.();
            currentModel = null;
        }
        showLoader('模型加载中...');
        let loader;
        if(type==='glb'||type==='gltf') {
            loader = new THREE.GLTFLoader();
            loader.load(path, gltf => {
                currentModel = gltf.scene;
                scene.add(currentModel);
                hideLoader();
            }, undefined, err => {
                hideLoader();
                showError('GLTF模型加载失败: '+err.message);
            });
        } else if(type==='obj') {
            loader = new THREE.OBJLoader();
            loader.load(path, obj => {
                currentModel = obj;
                scene.add(currentModel);
                hideLoader();
            }, undefined, err => {
                hideLoader();
                showError('OBJ模型加载失败: '+err.message);
            });
        } else if(type==='fbx') {
            loader = new THREE.FBXLoader();
            loader.load(path, fbx => {
                currentModel = fbx;
                scene.add(currentModel);
                hideLoader();
            }, undefined, err => {
                hideLoader();
                showError('FBX模型加载失败: '+err.message);
            });
        } else if(type==='stl') {
            loader = new THREE.STLLoader();
            loader.load(path, geometry => {
                const material = new THREE.MeshStandardMaterial({ color: 0x4a00e0 });
                currentModel = new THREE.Mesh(geometry, material);
                scene.add(currentModel);
                hideLoader();
            }, undefined, err => {
                hideLoader();
                showError('STL模型加载失败: '+err.message);
            });
        } else if(type==='ply') {
            loader = new THREE.PLYLoader();
            loader.load(path, geometry => {
                const material = new THREE.MeshStandardMaterial({ color: 0x4a00e0 });
                currentModel = new THREE.Mesh(geometry, material);
                scene.add(currentModel);
                hideLoader();
            }, undefined, err => {
                hideLoader();
                showError('PLY模型加载失败: '+err.message);
            });
        } else {
            // 默认立方体
            const geometry = new THREE.BoxGeometry(2,2,2);
            const material = new THREE.MeshStandardMaterial({ color: 0x4a00e0, metalness: 0.7, roughness: 0.3 });
            currentModel = new THREE.Mesh(geometry, material);
            scene.add(currentModel);
            hideLoader();
        }
    };
    // 默认加载第一个模型
    loadModel(models[0].path, models[0].type);
    // 动画循环
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    // 响应窗口大小变化
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    // 交互控制
    document.getElementById('zoom-in').onclick = () => { camera.position.z -= 0.5; };
    document.getElementById('zoom-out').onclick = () => { camera.position.z += 0.5; };
    document.getElementById('reset').onclick = () => { camera.position.set(0,0,5); controls.reset(); };
    document.getElementById('rotate').onclick = () => {
        if(currentModel) {
            currentModel.rotation.x += 0.2;
            currentModel.rotation.y += 0.2;
        }
    };
    // 测量按钮
    const measureBtn = document.getElementById('measure-btn');
    if (measureBtn) {
        measureBtn.onclick = () => {
            measureTool.setActive(!measureTool.active);
            measureBtn.classList.toggle('active', measureTool.active);
        };
    }
    // 导出按钮
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.onclick = () => {
            // 弹出导出选项
            let panel = document.getElementById('export-panel');
            if (!panel) {
                panel = document.createElement('div');
                panel.id = 'export-panel';
                panel.style.position = 'fixed';
                panel.style.left = '50%';
                panel.style.top = '50%';
                panel.style.transform = 'translate(-50%,-50%)';
                panel.style.background = 'rgba(30,30,40,0.98)';
                panel.style.color = '#fff';
                panel.style.padding = '22px 32px';
                panel.style.borderRadius = '16px';
                panel.style.fontSize = '1.1rem';
                panel.style.zIndex = '9999';
                panel.style.boxShadow = '0 2px 12px rgba(0,0,0,0.2)';
                panel.innerHTML = `
                  <div style="margin-bottom:16px;font-size:1.15rem;font-weight:bold;">导出模型/图片</div>
                  <button id="exp-png" style="margin-right:18px;">导出PNG图片</button>
                  <button id="exp-glb">导出GLB模型</button>
                  <button id="exp-close" style="margin-left:18px;">关闭</button>
                `;
                document.body.appendChild(panel);
            }
            panel.style.display = 'block';
            panel.querySelector('#exp-png').onclick = () => {
                exportTool.exportPNG(renderer, camera);
            };
            panel.querySelector('#exp-glb').onclick = async () => {
                if(currentModel) await exportTool.exportGLB(currentModel);
            };
            panel.querySelector('#exp-close').onclick = () => {
                panel.style.display = 'none';
            };
        };
    }
    // 材质编辑按钮
    const matBtn = document.getElementById('material-btn');
    if (matBtn) {
        matBtn.onclick = () => {
            if(currentModel && currentModel.material) materialEditor.edit(currentModel.material);
        };
    }
    // 移动端入口适配
    adaptMobileUI();
    // 移动端适配
    adaptMobileUI();
    // 保存场景引用
    window._3dScene = { renderer, controls, scene, camera, lights: { ambient: ambientLight, directional: directionalLight } };
    applySettings();
    animate();
// 文件上传，支持多格式
const fileInput = document.getElementById('file-input');
fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 100*1024*1024) {
        showError('文件过大，最大支持100MB');
        return;
    }
    const url = URL.createObjectURL(file);
    let type = 'glb';
    if(file.name.endsWith('.gltf')) type = 'gltf';
    else if(file.name.endsWith('.obj')) type = 'obj';
    else if(file.name.endsWith('.fbx')) type = 'fbx';
    else if(file.name.endsWith('.stl')) type = 'stl';
    else if(file.name.endsWith('.ply')) type = 'ply';
    else {
        showError('暂不支持该格式');
        return;
    }
    loadModel(url, type);
    // 添加到模型库（仅本地临时）
    models.push({
        name: file.name,
        desc: '用户上传',
        icon: 'fas fa-cube',
        path: url,
        type
    });
    renderModelList();
});
    });
    renderModelList();
});

// 初始化
window.addEventListener('DOMContentLoaded', () => {
    renderModelList();
    renderSettings();
    showPage('start-page');
});
