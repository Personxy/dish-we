Component({
  properties: {
    // 难度等级
    difficulty: {
      type: Number,
      value: 1,
    },
    // 难度文本
    difficultyText: {
      type: Array,
      value: [],
    },
    // 食材列表
    ingredients: {
      type: Array,
      value: [],
    },
    // 单位选项
    unitOptions: {
      type: Array,
      value: [],
    },
  },

  methods: {
    // 设置难度
    onSetDifficulty(e) {
      const level = parseInt(e.currentTarget.dataset.level);
      this.triggerEvent("setDifficulty", { level });
    },
    onEditIngredient(e) {
      const index = e.currentTarget.dataset.index;
      const ingredient = this.data.ingredients[index];
      this.triggerEvent("editIngredient", { index, ingredient });
    },
    // 显示食材弹窗
    onShowIngredientModal() {
      this.triggerEvent("showIngredientModal");
    },

    // 删除食材
    onDeleteIngredient(e) {
      const index = e.currentTarget.dataset.index;
      this.triggerEvent("deleteIngredient", { index });
    },
  },
});
