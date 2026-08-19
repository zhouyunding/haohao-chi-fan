const diaryRecords = { '2026-08-19': {} };

const mealOrder = ['breakfast', 'lunch', 'dinner'];
const mealLabels = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };
let selectedDiaryDate = '2026-08-19';
const dayDetail = document.querySelector('#dayDetail');
const shareModal = document.querySelector('#shareModal');

const welcomeBlock = document.querySelector('.welcome');
welcomeBlock.style.paddingBottom = '35px';
const shareButton = document.createElement('button');
shareButton.className = 'share-pill';
shareButton.type = 'button';
shareButton.textContent = '分享今日三餐';
welcomeBlock.appendChild(shareButton);

function dateKey(year, monthIndex, day) {
  const date = new Date(year, monthIndex, day);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function renderCuteCalendar() {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const first = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const total = new Date(year, monthIndex + 1, 0).getDate();
  const previousTotal = new Date(year, monthIndex, 0).getDate();
  const calendar = document.querySelector('#calendar');
  document.querySelector('#monthTitle').textContent = `${year}年 ${monthIndex + 1}月`;
  calendar.innerHTML = ['一', '二', '三', '四', '五', '六', '日']
    .map((day) => `<span class="weekday">${day}</span>`).join('');

  for (let index = 0; index < 42; index += 1) {
    const rawDay = index - first + 1;
    let displayDay = rawDay;
    let targetMonth = monthIndex;
    let outside = false;
    if (rawDay < 1) { displayDay = previousTotal + rawDay; targetMonth -= 1; outside = true; }
    if (rawDay > total) { displayDay = rawDay - total; targetMonth += 1; outside = true; }
    const key = dateKey(year, targetMonth, displayDay);
    const records = diaryRecords[key] || {};
    const button = document.createElement('button');
    button.className = `day${outside ? ' out' : ''}${key === selectedDiaryDate ? ' selected' : ''}`;
    button.type = 'button';
    button.dataset.date = key;
    button.innerHTML = `<b>${displayDay}</b><span class="meal-dots" aria-label="早午晚记录状态">
      <i class="breakfast ${records.breakfast ? 'on' : ''}"></i>
      <i class="lunch ${records.lunch ? 'on' : ''}"></i>
      <i class="dinner ${records.dinner ? 'on' : ''}"></i>
    </span>`;
    button.addEventListener('click', () => {
      selectedDiaryDate = key;
      renderCuteCalendar();
      openDayDetail(key);
      buzz();
    });
    calendar.appendChild(button);
  }
}

function openDayDetail(key) {
  const records = diaryRecords[key] || {};
  const [, monthNumber, dayNumber] = key.split('-').map(Number);
  document.querySelector('#detailTitle').textContent = `${monthNumber}月${dayNumber}日的三餐`;
  const completedCount = mealOrder.filter((meal) => records[meal]).length;
  document.querySelector('#detailSub').textContent = completedCount
    ? `这天记录了 ${completedCount} 顿，详细内容如下。`
    : '这天还没有饮食记录。';
  const grid = document.querySelector('#photoGrid');
  grid.innerHTML = '';
  if (!completedCount) {
    grid.innerHTML = '<div class="empty-day" style="grid-column:1/-1"><span>—</span>该日期暂无记录。</div>';
  } else {
    mealOrder.forEach((meal) => {
      const record = records[meal];
      if (!record) return;
      const card = document.createElement('article');
      card.className = 'photo-card';

      const photos = Array.isArray(record.photos) && record.photos.length
        ? record.photos
        : record.photo
          ? [record.photo]
          : [];
      const gallery = document.createElement('div');
      gallery.className = `photo-gallery ${meal}${photos.length > 1 ? ' multiple' : ''}`;
      if (photos.length) {
        photos.forEach((photo, index) => {
          const frame = document.createElement('div');
          frame.className = 'photo-frame';
          const image = document.createElement('img');
          image.src = photo;
          image.alt = `${record.title}，第${index + 1}张`;
          image.loading = 'lazy';
          frame.appendChild(image);
          gallery.appendChild(frame);
        });
      } else {
        const frame = document.createElement('div');
        frame.className = 'photo-frame';
        const emoji = document.createElement('span');
        emoji.textContent = record.emoji || '🍽️';
        frame.appendChild(emoji);
        gallery.appendChild(frame);
      }

      const title = document.createElement('strong');
      title.textContent = `${mealLabels[meal]} · ${record.title}`;
      if (photos.length > 1) {
        const count = document.createElement('small');
        count.className = 'photo-count';
        count.textContent = `${photos.length}张`;
        title.appendChild(count);
      }
      const note = document.createElement('p');
      note.textContent = record.note || '已完成本餐记录。';
      card.append(gallery, title, note);
      grid.appendChild(card);
    });
  }
  dayDetail.hidden = false;
}

document.querySelector('#detailClose').addEventListener('click', () => { dayDetail.hidden = true; });
dayDetail.addEventListener('click', (event) => { if (event.target === dayDetail) dayDetail.hidden = true; });

document.querySelectorAll('.upload input').forEach((input) => {
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const meal = input.closest('.meal').dataset.meal;
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const existing = diaryRecords['2026-08-19'][meal] || {};
      const existingPhotos = Array.isArray(existing.photos) && existing.photos.length
        ? existing.photos
        : existing.photo
          ? [existing.photo]
          : [];
      diaryRecords['2026-08-19'][meal] = {
        title: `${mealLabels[meal]}照片`,
        note: '图片已保存，食物内容等待确认。',
        photos: [...existingPhotos, reader.result]
      };
      selectedDiaryDate = '2026-08-19';
      renderCuteCalendar();
    });
    reader.readAsDataURL(file);
  });
});

const originalSave = document.querySelector('#save').onclick;
document.querySelector('#save').onclick = () => {
  const text = document.querySelector('#mealText').value.trim();
  const meal = editingMeal;
  originalSave();
  if (!text) return;
  const existing = diaryRecords['2026-08-19'][meal] || {};
  diaryRecords['2026-08-19'][meal] = {
    title: text.length > 12 ? `${text.slice(0, 12)}…` : text,
    note: text,
    emoji: { breakfast: '01', lunch: '02', dinner: '03' }[meal],
    photos: existing.photos || (existing.photo ? [existing.photo] : undefined)
  };
  selectedDiaryDate = '2026-08-19';
  renderCuteCalendar();
};

shareButton.addEventListener('click', () => { shareModal.hidden = false; buzz(); });
document.querySelector('#shareClose').addEventListener('click', () => { shareModal.hidden = true; });
shareModal.addEventListener('click', (event) => { if (event.target === shareModal) shareModal.hidden = true; });

const moreButton = document.querySelector('.topbar .round:last-child');
const moreMenu = document.createElement('div');
moreMenu.className = 'more-menu';
moreMenu.id = 'moreMenu';
moreMenu.hidden = true;
moreMenu.innerHTML = `
  <button type="button" data-more-action="share"><span class="more-icon">↗</span><span>分享今日记录</span></button>
  <button type="button" data-more-action="calendar"><span class="more-icon">▦</span><span>查看本月月历</span></button>
  <button type="button" data-more-action="mode"><span class="more-icon">⇄</span><span>切换记录模式</span></button>`;
document.querySelector('#appView').appendChild(moreMenu);

function closeMoreMenu() {
  moreMenu.classList.remove('is-open');
  moreButton?.setAttribute('aria-expanded', 'false');
  window.setTimeout(() => {
    if (!moreMenu.classList.contains('is-open')) moreMenu.hidden = true;
  }, 190);
}

function openMoreMenu() {
  moreMenu.hidden = false;
  moreButton?.setAttribute('aria-expanded', 'true');
  window.requestAnimationFrame(() => moreMenu.classList.add('is-open'));
}

if (moreButton) {
  moreButton.id = 'moreButton';
  moreButton.setAttribute('aria-label', '更多操作');
  moreButton.setAttribute('aria-controls', 'moreMenu');
  moreButton.setAttribute('aria-expanded', 'false');
  moreButton.addEventListener('click', (event) => {
    event.stopPropagation();
    if (moreMenu.hidden || !moreMenu.classList.contains('is-open')) openMoreMenu();
    else closeMoreMenu();
    buzz();
  });
}

moreMenu.querySelectorAll('[data-more-action]').forEach((button) => button.addEventListener('click', () => {
  const action = button.dataset.moreAction;
  closeMoreMenu();
  if (action === 'share') shareButton.click();
  if (action === 'calendar') {
    const appScroller = document.querySelector('#appScroll');
    appScroller?.scrollTo({ top: document.querySelector('#calendarSection').offsetTop - 55, behavior: 'smooth' });
  }
  if (action === 'mode') document.querySelector('#back')?.click();
}));

document.addEventListener('pointerdown', (event) => {
  if (moreMenu.hidden || moreMenu.contains(event.target) || moreButton?.contains(event.target)) return;
  closeMoreMenu();
}, { passive: true });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !moreMenu.hidden) closeMoreMenu();
});

document.querySelectorAll('[data-share]').forEach((button) => {
  button.addEventListener('click', async () => {
    const target = button.dataset.share;
    const records = diaryRecords['2026-08-19'];
    const meals = mealOrder.filter((meal) => records[meal]).map((meal) => `${mealLabels[meal]}：${records[meal].title}`).join('；');
    const message = target === 'family'
      ? `今日饮食记录：${meals || '今天暂未添加记录。'}`
      : `今日饮食进度：${meals || '今天暂未完成记录。'}`;
    try {
      if (navigator.share) await navigator.share({ title: '好好吃饭', text: message });
      else if (navigator.clipboard) { await navigator.clipboard.writeText(message); say('今日摘要已复制，可以发出去啦'); }
      else say(target === 'family' ? '已经整理好给家人的三餐摘要' : '已经整理好监督打卡摘要');
    } catch (error) {
      if (error.name !== 'AbortError') say('分享没成功，再试一次吧');
    }
    shareModal.hidden = true;
  });
});

renderCal = renderCuteCalendar;
renderCuteCalendar();

const introCopy = document.querySelector('.intro p');
if (introCopy) introCopy.textContent = '照片与文字，建立你的每日饮食档案。';

const intro = document.querySelector('.intro');
if (intro && !document.querySelector('#kineticPreview')) {
  const preview = document.createElement('div');
  preview.className = 'kinetic-preview spotlight-surface';
  preview.id = 'kineticPreview';
  preview.innerHTML = `
    <span class="kinetic-kicker">DAILY INTAKE / 2026</span>
    <div class="kinetic-word"><span>记录</span><span>每一餐</span></div>
    <div class="kinetic-track"><span>BREAKFAST · LUNCH · DINNER · NOTES · PHOTO · </span></div>
    <div class="kinetic-meter"><i></i><i></i><i></i><i></i><i></i></div>
    <span class="kinetic-note">YOUR MEAL ARCHIVE</span>`;
  intro.querySelector('.cat-sticker')?.before(preview);
}

completed.clear();
document.querySelectorAll('.step').forEach((step) => step.classList.remove('done'));
document.querySelector('#count').textContent = '今天还没记录';
document.querySelector('#fish').textContent = '0';
document.querySelector('#catTalk').textContent = '暂无记录，等待添加第一餐。';
document.querySelectorAll('.meal').forEach((meal) => {
  meal.querySelector('.status')?.remove();
  const copy = meal.querySelector('.meal-copy') || meal.querySelector('.meal-body p');
  if (copy) copy.textContent = `${mealLabels[meal.dataset.meal]}还没写。`;
});

document.querySelectorAll('.spotlight-surface, .choice, .meal').forEach((surface) => {
  surface.addEventListener('pointermove', (event) => {
    const rect = surface.getBoundingClientRect();
    surface.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    surface.style.setProperty('--my', `${event.clientY - rect.top}px`);
  });
});

document.querySelectorAll('.magnetic').forEach((button) => {
  button.addEventListener('pointermove', (event) => {
    const rect = button.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * 0.12;
    const y = (event.clientY - rect.top - rect.height / 2) * 0.12;
    button.style.setProperty('--tx', `${x}px`);
    button.style.setProperty('--ty', `${y}px`);
  });
  button.addEventListener('pointerleave', () => {
    button.style.setProperty('--tx', '0px');
    button.style.setProperty('--ty', '0px');
  });
});

const calorieData = {
  staple: [
    ['米饭', 116], ['面条', 137], ['全麦面包', 246], ['燕麦', 367]
  ],
  protein: [
    ['鸡胸肉', 133], ['鸡蛋', 144], ['牛肉', 250], ['豆腐', 81]
  ],
  vegetable: [
    ['西兰花', 34], ['番茄', 18], ['玉米', 112], ['生菜', 15]
  ],
  drink: [
    ['牛奶', 54], ['无糖豆浆', 31], ['酸奶', 72], ['咖啡（无糖）', 2]
  ]
};
const calorieLabels = { staple: '主食', protein: '蛋白质', vegetable: '蔬果', drink: '饮品', custom: '自定义' };
const calorieState = {
  meal: 'breakfast',
  category: 'staple',
  food: '米饭',
  weight: 150,
  customCategory: '',
  customFood: '',
  customPer100: 100,
  customUnit: 'g',
  log: [],
  baseRecords: {}
};

function refreshMealProgress() {
  const records = diaryRecords['2026-08-19'] || {};
  completed.clear();
  mealOrder.forEach((meal, index) => {
    const isDone = Boolean(records[meal]);
    if (isDone) completed.add(meal);
    document.querySelectorAll('.step')[index]?.classList.toggle('done', isDone);
  });
  document.querySelector('#count').textContent = completed.size
    ? `今天已记录 ${completed.size} 顿`
    : '今天还没记录';
  document.querySelector('#fish').textContent = completed.size;
  document.querySelector('#catTalk').textContent = completed.size === 3
    ? '今日三餐记录完整。'
    : completed.size
      ? `已完成 ${completed.size}/3，继续添加下一餐。`
      : '暂无记录，等待添加第一餐。';
}

function syncMealCardCopy(meal) {
  const copy = document.querySelector(`.meal[data-meal="${meal}"] .meal-copy`);
  if (!copy) return;
  const record = diaryRecords['2026-08-19']?.[meal];
  copy.textContent = record
    ? record.note || record.title || '已完成本餐记录。'
    : `${mealLabels[meal]}还没写。`;
}

function setupCalorieCalculator() {
  const panel = document.querySelector('#calories');
  if (!panel) return;
  panel.innerHTML = `
    <div class="section-head"><div><small>ENERGY METRIC</small><h2>今日热量</h2></div><span class="count" id="calorieTotal">0 KCAL</span></div>
    <div class="calorie-summary"><div class="ring"><div><strong id="ringKcal">0</strong><small>/ 1,800 KCAL</small></div></div><div class="summary-copy"><strong id="calorieHeadline">先添加一项食物</strong><span id="calorieSummary">选择餐次、食物和重量，系统会自动估算。</span></div></div>
    <div class="calculator-divider"></div>
    <label class="calc-label">MEAL</label><div class="meal-segment" id="mealSegment"><button class="segment-btn is-active" data-calc-meal="breakfast">早餐</button><button class="segment-btn" data-calc-meal="lunch">午餐</button><button class="segment-btn" data-calc-meal="dinner">晚餐</button></div>
    <label class="calc-label" style="margin-top:15px">FOOD TYPE</label><div class="category-segment" id="categorySegment">${Object.entries(calorieLabels).map(([key, label], index) => `<button class="segment-btn${index === 0 ? ' is-active' : ''}" data-calc-category="${key}">${label}</button>`).join('')}</div>
    <div class="food-field" id="presetFoodField"><label class="calc-label">FOOD</label><select class="food-select" id="foodSelect"></select><div class="food-meta"><span id="foodPer100">每 100g</span><span>估算值</span></div></div>
    <div class="custom-food-editor" id="customFoodEditor" hidden>
      <div class="custom-food-grid"><label><span class="calc-label">食物类型</span><input class="calc-input" id="customCategoryInput" type="text" maxlength="16" placeholder="例如：零食、汤品"></label><label><span class="calc-label">食物名称</span><input class="calc-input" id="customFoodInput" type="text" maxlength="24" placeholder="例如：曲奇饼干"></label></div>
      <div class="custom-energy-grid"><label><span class="calc-label">每 100 单位热量</span><div class="custom-kcal-input"><input class="calc-input" id="customPer100Input" type="number" min="1" max="2000" step="1" value="100"><span>KCAL</span></div></label><div><span class="calc-label">计量单位</span><div class="unit-segment"><button type="button" class="segment-btn is-active" data-custom-unit="g">克</button><button type="button" class="segment-btn" data-custom-unit="ml">毫升</button></div></div></div>
      <div class="food-meta"><span id="customFoodPer100">每 100g ≈ 100 kcal</span><span>由你填写</span></div>
    </div>
    <div class="weight-control"><div class="weight-line"><label class="calc-label" style="margin:0">WEIGHT</label><span class="weight-unit">克 / 毫升</span></div><div class="weight-stepper"><button type="button" id="weightMinus">−</button><input id="weightInput" type="number" min="1" max="2000" step="10" value="150"><button type="button" id="weightPlus">＋</button></div><input class="weight-range" id="weightRange" type="range" min="10" max="800" step="10" value="150"></div>
    <div class="estimate-row"><div class="estimate-copy"><span>ESTIMATED CALORIES</span><strong id="estimateKcal">174</strong><small> KCAL</small></div><button class="add-calorie" id="addCalorie" type="button">加入今日记录</button></div>
    <p class="calorie-disclaimer">热量是基于常见食材的估算值，烹饪方式和调味会产生差异。</p>
    <div class="calorie-log"><div class="calorie-log-head"><strong>今日已添加</strong><span id="logCount">0 项</span></div><div id="calorieLog"><div class="calorie-empty">还没有热量记录。</div></div></div>`;

  const mealButtons = panel.querySelectorAll('[data-calc-meal]');
  const categoryButtons = panel.querySelectorAll('[data-calc-category]');
  const foodSelect = panel.querySelector('#foodSelect');
  const presetFoodField = panel.querySelector('#presetFoodField');
  const customFoodEditor = panel.querySelector('#customFoodEditor');
  const customCategoryInput = panel.querySelector('#customCategoryInput');
  const customFoodInput = panel.querySelector('#customFoodInput');
  const customPer100Input = panel.querySelector('#customPer100Input');
  const customFoodPer100 = panel.querySelector('#customFoodPer100');
  const customUnitButtons = panel.querySelectorAll('[data-custom-unit]');
  const weightInput = panel.querySelector('#weightInput');
  const weightRange = panel.querySelector('#weightRange');
  const estimateKcal = panel.querySelector('#estimateKcal');
  const foodPer100 = panel.querySelector('#foodPer100');
  const totalEl = panel.querySelector('#calorieTotal');
  const ringKcal = panel.querySelector('#ringKcal');
  const headline = panel.querySelector('#calorieHeadline');
  const summary = panel.querySelector('#calorieSummary');
  const logContainer = panel.querySelector('#calorieLog');
  const logCount = panel.querySelector('#logCount');
  const weightUnit = panel.querySelector('.weight-unit');
  const addCalorieButton = panel.querySelector('#addCalorie');

  function currentFood() {
    if (calorieState.category === 'custom') {
      return [calorieState.customFood.trim(), Math.max(0, Number(calorieState.customPer100) || 0)];
    }
    return calorieData[calorieState.category].find(([name]) => name === calorieState.food) || calorieData[calorieState.category][0];
  }
  function currentUnit() {
    if (calorieState.category === 'custom') return calorieState.customUnit;
    return calorieState.category === 'drink' ? 'ml' : 'g';
  }
  function currentCategoryLabel() {
    return calorieState.category === 'custom'
      ? calorieState.customCategory.trim()
      : calorieLabels[calorieState.category];
  }
  function customFoodIsValid() {
    return Boolean(
      calorieState.customCategory.trim() &&
      calorieState.customFood.trim() &&
      Number(calorieState.customPer100) > 0
    );
  }
  function updateAddState() {
    const disabled = calorieState.category === 'custom' && !customFoodIsValid();
    addCalorieButton.classList.toggle('is-disabled', disabled);
    addCalorieButton.dataset.incomplete = String(disabled);
    addCalorieButton.textContent = disabled ? '请完善自定义信息' : '加入今日记录';
  }
  function renderFoods() {
    const isCustom = calorieState.category === 'custom';
    presetFoodField.hidden = isCustom;
    customFoodEditor.hidden = !isCustom;
    if (isCustom) {
      weightUnit.textContent = calorieState.customUnit === 'ml' ? '毫升' : '克';
      renderEstimate();
      return;
    }
    foodSelect.innerHTML = calorieData[calorieState.category].map(([name, kcal]) => `<option value="${name}">${name}</option>`).join('');
    foodSelect.value = calorieState.food = calorieData[calorieState.category][0][0];
    weightUnit.textContent = calorieState.category === 'drink' ? '毫升' : '克';
    foodPer100.textContent = `每 100${currentUnit()} ≈ ${calorieData[calorieState.category][0][1]} kcal`;
    renderEstimate();
  }
  function renderEstimate() {
    const [name, per100] = currentFood();
    const weight = Math.max(1, Number(weightInput.value) || 1);
    const kcal = Math.round(per100 * weight / 100);
    estimateKcal.textContent = kcal;
    if (calorieState.category === 'custom') {
      customFoodPer100.textContent = per100
        ? `每 100${currentUnit()} ≈ ${per100} kcal`
        : `填写每 100${currentUnit()} 的热量`;
      weightUnit.textContent = currentUnit() === 'ml' ? '毫升' : '克';
    } else {
      foodPer100.textContent = `每 100${currentUnit()} ≈ ${per100} kcal`;
    }
    calorieState.weight = weight;
    calorieState.food = name;
    updateAddState();
  }
  function renderLog() {
    const total = calorieState.log.reduce((sum, item) => sum + item.kcal, 0);
    totalEl.textContent = `${total} KCAL`;
    ringKcal.textContent = total;
    panel.style.setProperty('--cal-progress', `${Math.min(total / 1800, 1) * 360}deg`);
    headline.textContent = total ? `${total} KCAL 已记录` : '先添加一项食物';
    summary.textContent = total ? `还可以记录约 ${Math.max(0, 1800 - total)} KCAL。` : '选择餐次、食物和重量，系统会自动估算。';
    logCount.textContent = `${calorieState.log.length} 项`;
    mealOrder.forEach((meal) => {
      const items = calorieState.log.filter((item) => item.meal === meal);
      if (!items.length) {
        if (Object.prototype.hasOwnProperty.call(calorieState.baseRecords, meal)) {
          const baseRecord = calorieState.baseRecords[meal];
          if (baseRecord) diaryRecords['2026-08-19'][meal] = baseRecord;
          else delete diaryRecords['2026-08-19'][meal];
          delete calorieState.baseRecords[meal];
        }
        syncMealCardCopy(meal);
        return;
      }
      const mealKcal = items.reduce((sum, item) => sum + item.kcal, 0);
      const foodNames = [...new Set(items.map((item) => item.food))];
      const baseRecord = calorieState.baseRecords[meal];
      diaryRecords['2026-08-19'][meal] = {
        ...(baseRecord || {}),
        title: foodNames.join('、'),
        note: `${items.length} 项食物 · 估算 ${mealKcal} kcal`,
        calories: mealKcal,
        calorieGenerated: true
      };
      const copy = document.querySelector(`.meal[data-meal="${meal}"] .meal-copy`);
      if (copy) copy.textContent = `${foodNames.join('、')} · 约 ${mealKcal} kcal`;
    });
    refreshMealProgress();
    renderCuteCalendar();

    if (!calorieState.log.length) {
      logContainer.innerHTML = '<div class="calorie-empty">还没有热量记录。</div>';
      return;
    }
    logContainer.innerHTML = calorieState.log.map((item, index) => `<div class="calorie-entry"><div><strong>${mealLabels[item.meal]} · ${item.food}</strong><small>${item.category} · ${item.weight}${item.unit}</small></div><b>${item.kcal}</b><button class="calorie-remove" type="button" data-remove-calorie="${index}">×</button></div>`).join('');
    logContainer.querySelectorAll('[data-remove-calorie]').forEach((button) => button.addEventListener('click', () => {
      calorieState.log.splice(Number(button.dataset.removeCalorie), 1);
      renderLog();
    }));
  }
  mealButtons.forEach((button) => button.addEventListener('click', () => {
    mealButtons.forEach((item) => item.classList.remove('is-active'));
    button.classList.add('is-active');
    calorieState.meal = button.dataset.calcMeal;
  }));
  categoryButtons.forEach((button) => button.addEventListener('click', () => {
    categoryButtons.forEach((item) => item.classList.remove('is-active'));
    button.classList.add('is-active');
    calorieState.category = button.dataset.calcCategory;
    renderFoods();
  }));
  foodSelect.addEventListener('change', () => { calorieState.food = foodSelect.value; renderEstimate(); });
  customCategoryInput.addEventListener('input', () => { calorieState.customCategory = customCategoryInput.value; renderEstimate(); });
  customFoodInput.addEventListener('input', () => { calorieState.customFood = customFoodInput.value; renderEstimate(); });
  customPer100Input.addEventListener('input', () => { calorieState.customPer100 = Number(customPer100Input.value) || 0; renderEstimate(); });
  customUnitButtons.forEach((button) => button.addEventListener('click', () => {
    customUnitButtons.forEach((item) => item.classList.remove('is-active'));
    button.classList.add('is-active');
    calorieState.customUnit = button.dataset.customUnit;
    renderEstimate();
  }));
  weightInput.addEventListener('input', () => { weightRange.value = weightInput.value; renderEstimate(); });
  weightRange.addEventListener('input', () => { weightInput.value = weightRange.value; renderEstimate(); });
  panel.querySelector('#weightMinus').addEventListener('click', () => { weightInput.value = Math.max(10, Number(weightInput.value) - 10); weightRange.value = weightInput.value; renderEstimate(); });
  panel.querySelector('#weightPlus').addEventListener('click', () => { weightInput.value = Math.min(2000, Number(weightInput.value) + 10); weightRange.value = weightInput.value; renderEstimate(); });
  addCalorieButton.addEventListener('click', () => {
    if (calorieState.category === 'custom' && !customFoodIsValid()) {
      say('请填写食物类型、名称和每 100 单位热量');
      (calorieState.customCategory.trim() ? customFoodInput : customCategoryInput).focus();
      return;
    }
    const [food, per100] = currentFood();
    const weight = Math.max(1, Number(weightInput.value) || 1);
    const kcal = Math.round(per100 * weight / 100);
    if (!Object.prototype.hasOwnProperty.call(calorieState.baseRecords, calorieState.meal)) {
      const existing = diaryRecords['2026-08-19'][calorieState.meal];
      calorieState.baseRecords[calorieState.meal] = existing ? { ...existing } : null;
    }
    calorieState.log.push({
      meal: calorieState.meal,
      category: currentCategoryLabel(),
      food,
      weight,
      unit: currentUnit(),
      kcal
    });
    mealDates.add('2026-08-19');
    renderLog();
    react('热量记录已保存');
    say(`${food} 已加入 ${mealLabels[calorieState.meal]}`);
  });
  renderFoods();
  renderLog();
}
setupCalorieCalculator();

document.querySelectorAll('.meal').forEach((mealCard) => {
  const actions = mealCard.querySelector('.record-actions');
  if (!actions || actions.querySelector('.calc-trigger')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'calc-trigger';
  button.textContent = '估算热量';
  button.addEventListener('click', () => {
    const meal = mealCard.dataset.meal;
    document.querySelector(`[data-calc-meal="${meal}"]`)?.click();
    document.querySelector('#calories')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    say(`正在估算${mealLabels[meal]}热量`);
  });
  actions.appendChild(button);
});

const modalSheet = document.querySelector('#modal .sheet');
const textarea = document.querySelector('#mealText');
const noteContext = document.createElement('div');
noteContext.className = 'note-context';
noteContext.innerHTML = '<strong id="noteMealName">早餐备注</strong><span>保存后显示在餐次下方</span>';
const noteHint = document.createElement('p');
noteHint.className = 'note-hint';
noteHint.textContent = '可以记录食物内容、分量、口味，或吃完之后的感受。';
const noteChips = document.createElement('div');
noteChips.className = 'note-chips';
['七分饱', '口味清淡', '有点赶时间', '饭后很舒服'].forEach((text) => {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'note-chip';
  chip.textContent = text;
  chip.addEventListener('click', () => {
    const separator = textarea.value.trim() ? '，' : '';
    textarea.value = `${textarea.value.trim()}${separator}${text}`;
    textarea.focus();
  });
  noteChips.appendChild(chip);
});
modalSheet.querySelector('h3')?.after(noteContext);
textarea.after(noteHint, noteChips);

function configureNoteModal(meal) {
  const title = document.querySelector('#modal .sheet h3');
  if (title) title.textContent = `${mealLabels[meal]} · 添加备注`;
  if (textarea) textarea.placeholder = `写下${mealLabels[meal]}的食物、口味或当时的状态，这句话会显示在${mealLabels[meal]}记录下方。`;
  const mealName = document.querySelector('#noteMealName');
  if (mealName) mealName.textContent = `${mealLabels[meal]}备注`;
}

document.querySelectorAll('.write').forEach((button) => button.addEventListener('click', () => {
  configureNoteModal(button.closest('.meal')?.dataset.meal);
}));
document.querySelector('[data-nav="add"]')?.addEventListener('click', () => {
  window.setTimeout(() => configureNoteModal(editingMeal), 0);
});
document.querySelector('[data-nav="mine"]')?.addEventListener('click', () => {
  window.setTimeout(() => say('个人档案功能准备中'), 0);
});

const sceneWipe = document.createElement('div');
sceneWipe.className = 'scene-wipe';
document.body.appendChild(sceneWipe);
const scrollProgress = document.createElement('div');
scrollProgress.className = 'scroll-progress';
document.querySelector('#appView').appendChild(scrollProgress);

function playSceneWipe() {
  sceneWipe.classList.remove('is-active');
  void sceneWipe.offsetWidth;
  sceneWipe.classList.add('is-active');
}

document.querySelectorAll('.enter').forEach((button) => button.addEventListener('click', () => {
  const selectedMode = button.dataset.mode;
  document.querySelector('#appView').dataset.mode = selectedMode;
  if (!document.body.classList.contains('particle-transition-completing')) playSceneWipe();
}));
document.querySelector('#back')?.addEventListener('click', playSceneWipe);

const revealTargets = document.querySelectorAll('.welcome, .companion, #calendarSection, .meals-head, #calories');
revealTargets.forEach((target) => target.classList.add('reveal-mobile'));
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('is-visible');
  });
}, { root: document.querySelector('#appScroll'), threshold: 0.08 });
revealTargets.forEach((target) => revealObserver.observe(target));

document.querySelector('#appScroll')?.addEventListener('scroll', (event) => {
  const scroller = event.currentTarget;
  const max = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
  scrollProgress.style.transform = `scaleX(${Math.min(1, scroller.scrollTop / max)})`;
  document.querySelector('#appView').classList.toggle('touch-shift', scroller.scrollTop > 8);
}, { passive: true });

document.addEventListener('pointerdown', (event) => {
  const target = event.target.closest('button, .upload, .choice');
  if (!target) return;
  const rect = target.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'touch-ripple';
  ripple.style.left = `${event.clientX - rect.left}px`;
  ripple.style.top = `${event.clientY - rect.top}px`;
  target.appendChild(ripple);
  window.setTimeout(() => ripple.remove(), 760);

  const surface = event.target.closest('.spotlight-surface, .choice, .meal');
  if (surface) {
    const surfaceRect = surface.getBoundingClientRect();
    surface.style.setProperty('--mx', `${event.clientX - surfaceRect.left}px`);
    surface.style.setProperty('--my', `${event.clientY - surfaceRect.top}px`);
    surface.classList.add('touch-lit');
    window.setTimeout(() => surface.classList.remove('touch-lit'), 520);
  }
});

const kineticPreview = document.querySelector('#kineticPreview');
kineticPreview?.addEventListener('touchmove', (event) => {
  const touch = event.touches[0];
  const rect = kineticPreview.getBoundingClientRect();
  const shift = ((touch.clientX - rect.left) / rect.width - 0.5) * 12;
  kineticPreview.querySelector('.kinetic-word').style.transform = `translateX(${shift}px)`;
}, { passive: true });
kineticPreview?.addEventListener('touchend', () => {
  kineticPreview.querySelector('.kinetic-word').style.transform = '';
}, { passive: true });
