document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup Champion Selection UI
    const champTabs = document.querySelectorAll('.champ-tab');
    const champListContainer = document.getElementById('champListContainer');
    const selectedChampsPreview = document.getElementById('selectedChampsPreview');
    const favoriteChampionsInput = document.getElementById('favoriteChampions');
    
    const azFilter = document.getElementById('azFilter');
    const champSearch = document.getElementById('champSearch');
    const clearChampFilters = document.getElementById('clearChampFilters');
    
    let selectedChampions = new Set();
    let currentRole = 'All';
    let currentFilterLetter = 'ALL';
    let currentSearchQuery = '';
    
    // Default data if championsByRole fails to load
    const champData = typeof championsByRole !== 'undefined' ? championsByRole : {
        'Top': ['亚索 (Yasuo)', '盖伦 (Garen)'],
        'Jungle': ['盲僧 (Lee Sin)', '剑圣 (Master Yi)'],
        'Mid': ['劫 (Zed)', '阿狸 (Ahri)'],
        'ADC': ['伊泽瑞尔 (Ezreal)', '薇恩 (Vayne)'],
        'Support': ['锤石 (Thresh)', '璐璐 (Lulu)']
    };

    // Generate A-Z letters
    if (azFilter) {
        const letters = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
        letters.forEach(letter => {
            const span = document.createElement('span');
            span.className = `az-letter ${letter === 'ALL' ? 'active' : ''}`;
            span.dataset.letter = letter;
            span.textContent = letter === 'ALL' ? '全部' : letter;
            span.addEventListener('click', () => {
                document.querySelectorAll('.az-letter').forEach(el => el.classList.remove('active'));
                span.classList.add('active');
                currentFilterLetter = letter;
                renderChampionsForRole(currentRole);
            });
            azFilter.appendChild(span);
        });
    }

    if (champSearch) {
        champSearch.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value.toLowerCase();
            renderChampionsForRole(currentRole);
        });
    }

    if (clearChampFilters) {
        clearChampFilters.addEventListener('click', () => {
            currentFilterLetter = 'ALL';
            currentSearchQuery = '';
            if (champSearch) champSearch.value = '';
            document.querySelectorAll('.az-letter').forEach(el => {
                if (el.dataset.letter === 'ALL') el.classList.add('active');
                else el.classList.remove('active');
            });
            renderChampionsForRole(currentRole);
        });
    }

    function getAllChampions() {
        const all = new Set();
        Object.values(champData).forEach(list => list.forEach(c => all.add(c)));
        return Array.from(all).sort();
    }

    function renderChampionsForRole(role) {
        currentRole = role;
        if (!champListContainer) return;
        champListContainer.innerHTML = '';
        let list = role === 'All' ? getAllChampions() : (champData[role] || []);
        
        // Apply Filters
        list = list.filter(champ => {
            // A-Z Filter (match the first english letter inside parentheses)
            if (currentFilterLetter !== 'ALL') {
                const match = champ.match(/\(([A-Za-z])/);
                if (!match || match[1].toUpperCase() !== currentFilterLetter) {
                    return false;
                }
            }
            // Search Filter
            if (currentSearchQuery) {
                if (!champ.toLowerCase().includes(currentSearchQuery)) {
                    return false;
                }
            }
            return true;
        });

        if (list.length === 0) {
            champListContainer.innerHTML = '<span style="color:var(--text-muted);font-size:0.9rem;padding:1rem;">未找到符合条件的英雄</span>';
            return;
        }

        list.forEach(champ => {
            const badge = document.createElement('div');
            badge.className = 'champ-badge';
            if (selectedChampions.has(champ)) {
                badge.classList.add('selected');
            }
            badge.textContent = champ;
            badge.addEventListener('click', () => {
                if (selectedChampions.has(champ)) {
                    selectedChampions.delete(champ);
                    badge.classList.remove('selected');
                } else {
                    selectedChampions.add(champ);
                    badge.classList.add('selected');
                }
                updateSelectedPreview();
            });
            champListContainer.appendChild(badge);
        });
    }

    function updateSelectedPreview() {
        if (!selectedChampsPreview || !favoriteChampionsInput) return;
        selectedChampsPreview.innerHTML = '';
        if (selectedChampions.size === 0) {
            selectedChampsPreview.innerHTML = '<span class="preview-placeholder">尚未选择英雄，请在上方点击选择</span>';
            favoriteChampionsInput.value = '';
            return;
        }
        
        selectedChampions.forEach(champ => {
            const tag = document.createElement('div');
            tag.className = 'preview-tag';
            tag.innerHTML = `<span>${champ}</span> <span class="remove-btn">&times;</span>`;
            tag.querySelector('.remove-btn').addEventListener('click', () => {
                selectedChampions.delete(champ);
                updateSelectedPreview();
                renderChampionsForRole(currentRole);
            });
            selectedChampsPreview.appendChild(tag);
        });
        
        // Update hidden input
        favoriteChampionsInput.value = Array.from(selectedChampions).join(', ');
    }

    if (champTabs.length > 0) {
        // Initial render
        renderChampionsForRole('All');
        
        champTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                champTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderChampionsForRole(tab.dataset.role);
            });
        });
    }

    // 2. Form Submission
    const form = document.getElementById('surveyForm');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Gather data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Handle multiple checkboxes properly for position and playStyle
            data.position = formData.getAll('position').join(', ');
            data.playStyle = formData.getAll('playStyle').join(', ');
            
            // Validation rules
            const requiredFields = [
                { key: 'wechatId', name: '微信 ID' },
                { key: 'nickname', name: '微信昵称/群名片' },
                { key: 'gameId', name: '游戏 ID' },
                { key: 'email', name: '电子邮箱' },
                { key: 'age', name: '年龄' },
                { key: 'gender', name: '性别' },
                { key: 'region', name: '所在国家/地区' },
                { key: 'playYears', name: '英雄联盟游玩时长' },
                { key: 'rank', name: '游戏段位' },
                { key: 'position', name: '擅长位置' },
                { key: 'playStyle', name: '游戏偏好' },
                { key: 'favoriteChampions', name: '本命英雄' }
            ];

            for (const field of requiredFields) {
                if (!data[field.key] || data[field.key].trim() === '') {
                    showToast(`❌ 请填写或选择【${field.name}】！`, true);
                    return;
                }
            }

            const timeStart = formData.get('timeStart');
            const timeEnd = formData.get('timeEnd');
            if (!timeStart || !timeEnd) {
                showToast(`❌ 请选择完整的【常用活跃时段】起止时间！`, true);
                return;
            }
            
            // Handle activeTime combination
            if (timeStart && timeEnd) {
                data.activeTime = `${timeStart} - ${timeEnd}`;
                delete data.timeStart;
                delete data.timeEnd;
            }
            
            try {
                // Submit to backend API
                const response = await fetch('/api/survey', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    showToast('✅ 提交成功！跳转到看板...', false);
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                } else {
                    // Show error from backend (e.g. duplicate email)
                    showToast('❌ ' + (result.error || '提交失败，请重试！'), true);
                }
            } catch (error) {
                console.error('Error submitting survey:', error);
                showToast('❌ 网络错误，无法连接到服务器！', true);
            }
        });
    }
});

function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        if (isError) {
            toast.style.background = '#ef4444';
            toast.style.boxShadow = '0 10px 25px rgba(239, 68, 68, 0.4)';
        } else {
            toast.style.background = '#10b981';
            toast.style.boxShadow = '0 10px 25px rgba(16, 185, 129, 0.4)';
        }
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

