Component({
  options: {
    multipleSlots: true, // 在组件定义时的选项中启用多slot支持
  },
  properties: {
    // 列表数据
    list: {
      type: Array,
      value: [],
      observer: function (newVal) {
        console.log("列表数据更新:", newVal);
      },
    },

    // 是否处于排序模式
    sorting: {
      type: Boolean,
      value: false,
    },
    // 唯一标识字段名
    idKey: {
      type: String,
      value: "id",
    },
    // 拖拽手柄的类名
    handleClass: {
      type: String,
      value: "drag-handle",
    },
    useSlot: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    dragStartY: 0, // 拖拽开始的Y坐标
    dragStartIndex: -1, // 拖拽开始的索引
    dragItemHeight: 0, // 拖拽项的高度
    dragCurrentIndex: -1, // 当前拖拽项的索引
    draggingItem: null, // 当前拖拽的项
    draggingStyle: "", // 拖拽项的样式
    itemStyles: [], // 所有项的样式
    animating: false, // 是否正在动画中
  },

  methods: {
    // 拖拽开始
    dragStart: function (e) {
      if (!this.properties.sorting) return;

      const index = e.currentTarget.dataset.index;
      const touch = e.touches[0];
      const item = this.properties.list[index];

      // 获取元素高度和位置
      const query = wx.createSelectorQuery().in(this);
      query.selectAll(".drag-item").boundingClientRect();
      query.exec((res) => {
        if (res && res[0] && res[0][index]) {
          const itemRect = res[0][index];
          const itemHeight = itemRect.height;
          const itemTop = itemRect.top;

          // 计算所有项的初始位置
          const itemStyles = res[0].map((rect) => {
            return `transform: translate3d(0, 0, 0); transition: transform 0.3s;`;
          });

          // 设置拖拽项的样式
          itemStyles[
            index
          ] = `transform: translate3d(0, 0, 0); transition: none; z-index: 10; opacity: 0.9; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);`;

          this.setData({
            dragStartY: touch.clientY,
            dragStartIndex: index,
            dragCurrentIndex: index,
            dragItemHeight: itemHeight,
            draggingItem: item,
            itemStyles: itemStyles,
            draggingStyle: `transform: translate3d(0, 0, 0); transition: none; z-index: 10; opacity: 0.9; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);`,
          });
        }
      });
    },

    // 拖拽移动
    dragMove: function (e) {
      if (!this.properties.sorting || this.data.dragStartIndex === -1) return;

      const touch = e.touches[0];
      const moveY = touch.clientY - this.data.dragStartY;

      // 更新拖拽项的位置
      const draggingStyle = `transform: translate3d(0, ${moveY}px, 0); transition: none; z-index: 10; opacity: 0.9; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);`;

      // 计算新的索引位置
      const moveIndex = Math.round(moveY / this.data.dragItemHeight);
      let newIndex = this.data.dragStartIndex + moveIndex;

      // 确保新索引在有效范围内
      if (newIndex < 0) newIndex = 0;
      if (newIndex >= this.properties.list.length) newIndex = this.properties.list.length - 1;

      if (newIndex !== this.data.dragCurrentIndex && !this.data.animating) {
        // 更新其他项的位置
        const itemStyles = [...this.data.itemStyles];

        // 计算每个项的位移
        for (let i = 0; i < this.properties.list.length; i++) {
          if (i === this.data.dragStartIndex) continue;

          let offset = 0;
          if (this.data.dragStartIndex < newIndex) {
            // 向下拖动
            if (i > this.data.dragStartIndex && i <= newIndex) {
              offset = -this.data.dragItemHeight;
            }
          } else if (this.data.dragStartIndex > newIndex) {
            // 向上拖动
            if (i >= newIndex && i < this.data.dragStartIndex) {
              offset = this.data.dragItemHeight;
            }
          }

          itemStyles[i] = `transform: translate3d(0, ${offset}px, 0); transition: transform 0.3s;`;
        }

        this.setData({
          draggingStyle: draggingStyle,
          itemStyles: itemStyles,
          dragCurrentIndex: newIndex,
          animating: true,
        });

        // 动画结束后重置animating状态
        setTimeout(() => {
          this.setData({
            animating: false,
          });
        }, 300);
      } else {
        this.setData({
          draggingStyle: draggingStyle,
        });
      }
    },

    // 拖拽结束
    dragEnd: function () {
      if (!this.properties.sorting || this.data.dragStartIndex === -1) return;

      // 获取最终排序结果
      const startIndex = this.data.dragStartIndex;
      const endIndex = this.data.dragCurrentIndex;

      if (startIndex !== endIndex) {
        // 通知父组件排序变化
        const newList = [...this.properties.list];
        const item = newList[startIndex];

        // 从原位置移除
        newList.splice(startIndex, 1);
        // 插入到新位置
        newList.splice(endIndex, 0, item);

        this.triggerEvent("sort", {
          list: newList,
          from: startIndex,
          to: endIndex,
        });
      }

      // 重置拖拽状态
      this.setData({
        dragStartIndex: -1,
        dragCurrentIndex: -1,
        draggingItem: null,
        draggingStyle: "",
        itemStyles: [],
        animating: false,
      });
    },

    // 点击项目
    onItemTap: function (e) {
      if (this.properties.sorting) return;

      const index = e.currentTarget.dataset.index;
      const item = this.properties.list[index];

      this.triggerEvent("itemtap", {
        item: item,
        index: index,
      });
    },
  },
});
