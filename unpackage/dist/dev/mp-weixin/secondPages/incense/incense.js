"use strict";
const common_vendor = require("../../common/vendor.js");
const store_userInfo = require("../../store/userInfo.js");
const apis_user = require("../../apis/user.js");
const pageBack = () => "../../components/title/title.js";
const _sfc_main = {
  name: "IncensePage",
  components: {
    pageBack
  },
  data() {
    return {
      // 头部标题配置
      titleInfo: {
        titleShow: true,
        title: "电子上香",
        imageUrl: "http://t73sifiwt.hn-bkt.clouddn.com/pageBack/3.webp",
        heightShow: false,
        backShow: true
      },
      // 选中的香火类型
      selectedIncenseType: "",
      // 捐献金额
      donationAmount: "",
      // 香火类型列表
      incenseTypeList: [
        {
          label: "普通香",
          value: "normal"
        },
        {
          label: "高香",
          value: "high"
        },
        {
          label: "檀香",
          value: "sandalwood"
        },
        {
          label: "沉香",
          value: "agarwood"
        }
      ],
      // 快捷金额列表
      quickAmountList: [9, 19, 29, 39, 99, 199],
      // 新增：滚动公告相关
      noticeList: [],
      // 公告列表
      scrollDuration: 30,
      // 滚动动画时长
      noticeTimer: null,
      // 定时器
      // 模拟用户昵称池
      nicknamePool: ["清风居士", "善男信女", "随缘客", "静心人", "福运君", "平安客", "吉祥翁", "如意姑"]
    };
  },
  onLoad() {
    this.initNoticeList();
    this.startNoticeTimer();
    this.checkFirstVisit();
  },
  onUnload() {
    if (this.noticeTimer) {
      clearInterval(this.noticeTimer);
      this.noticeTimer = null;
    }
  },
  methods: {
    /**
     * 检查是否首次进入
     */
    checkFirstVisit() {
      const hasVisited = common_vendor.index.getStorageSync("incense_first_visit");
      if (!hasVisited) {
        setTimeout(() => {
          this.$refs.firstVisitPopup.open();
        }, 300);
      }
    },
    /**
     * 关闭首次进入弹窗
     */
    closeFirstVisitPopup() {
      common_vendor.index.setStorageSync("incense_first_visit", true);
      this.$refs.firstVisitPopup.close();
    },
    /**
     * 新增：初始化公告列表
     */
    initNoticeList() {
      for (let i = 0; i < 5; i++) {
        this.addNewNotice();
      }
    },
    /**
     * 新增：添加新的公告
     */
    addNewNotice() {
      const randomNickname = this.nicknamePool[Math.floor(Math.random() * this.nicknamePool.length)];
      const randomIncense = this.incenseTypeList[Math.floor(Math.random() * this.incenseTypeList.length)].label;
      const randomAmount = this.quickAmountList[Math.floor(Math.random() * this.quickAmountList.length)];
      const noticeText = `${randomNickname} 供奉了${randomIncense}，捐献￥${randomAmount} `;
      this.noticeList.unshift(noticeText);
      if (this.noticeList.length > 10) {
        this.noticeList.pop();
      }
    },
    /**
     * 新增：启动公告定时器
     */
    startNoticeTimer() {
      this.noticeTimer = setInterval(() => {
        this.addNewNotice();
        this.scrollDuration = 25 + Math.random() * 10;
      }, 5e3 + Math.random() * 5e3);
    },
    /**
     * 打开弹窗
     */
    openPopup() {
      this.$refs.incensePopup.open();
    },
    /**
     * 关闭弹窗
     */
    closePopup() {
      this.$refs.incensePopup.close();
      this.selectedIncenseType = "";
      this.donationAmount = "";
    },
    /**
     * 选择香火类型
     */
    selectIncenseType(type) {
      this.selectedIncenseType = type;
    },
    /**
     * 选择快捷金额
     */
    selectQuickAmount(amount) {
      this.donationAmount = amount.toString();
    },
    /**
     * 确认供奉
     */
    confirmOffer() {
      const store = store_userInfo.useUserInfoStore();
      if (!store.$state.userInfo.id) {
        return common_vendor.index.showModal({
          title: "请先登录",
          content: "登录后才可以供奉香火并累计香火值",
          showCancel: false,
          success: () => {
            common_vendor.index.navigateTo({
              url: "/pages/login/login"
            });
          }
        });
      }
      if (!this.selectedIncenseType) {
        common_vendor.index.showToast({
          title: "请选择香火类型",
          icon: "none",
          duration: 2e3
        });
        return;
      }
      if (!this.donationAmount || parseFloat(this.donationAmount) <= 0) {
        common_vendor.index.showToast({
          title: "请输入捐献金额",
          icon: "none",
          duration: 2e3
        });
        return;
      }
      const amount = parseFloat(this.donationAmount);
      if (isNaN(amount) || amount <= 0) {
        common_vendor.index.showToast({
          title: "请输入有效的金额",
          icon: "none",
          duration: 2e3
        });
        return;
      }
      const selectedType = this.incenseTypeList.find((item) => item.value === this.selectedIncenseType);
      common_vendor.index.showLoading({
        title: "微信支付中",
        mask: true
      });
      setTimeout(() => {
        apis_user.incensePayAPI({
          user_id: store.$state.userInfo.id,
          amount
        }).then((res) => {
          common_vendor.index.hideLoading();
          if (res.status === 200) {
            store.$state.userInfo.balance = res.newBalance;
            const userNotice = `您 供奉了${selectedType ? selectedType.label : "香火"}，捐献￥${amount} ，香火值已入账`;
            this.noticeList.unshift(userNotice);
            if (this.noticeList.length > 10) {
              this.noticeList.pop();
            }
            common_vendor.index.showToast({
              title: `已供奉${selectedType ? selectedType.label : "香火"}，香火值+${amount}`,
              icon: "success",
              duration: 2500
            });
            this.closePopup();
            this.offerIncense();
          } else {
            common_vendor.index.showToast({
              title: res.message || "支付失败，请重试",
              icon: "none"
            });
          }
        }).catch(() => {
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({
            title: "网络异常，请稍后重试",
            icon: "none"
          });
        });
      }, 600);
    },
    /**
     * 上香操作方法
     * 提示香火已奉上
     */
    offerIncense() {
    }
  }
};
if (!Array) {
  const _component_pageBack = common_vendor.resolveComponent("pageBack");
  const _easycom_uni_popup2 = common_vendor.resolveComponent("uni-popup");
  (_component_pageBack + _easycom_uni_popup2)();
}
const _easycom_uni_popup = () => "../../uni_modules/uni-popup/components/uni-popup/uni-popup.js";
if (!Math) {
  _easycom_uni_popup();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.p({
      titleInfo: $data.titleInfo
    }),
    b: common_vendor.f($data.noticeList, (item, index, i0) => {
      return {
        a: common_vendor.t(item),
        b: index
      };
    }),
    c: $data.scrollDuration + "s",
    d: common_vendor.o((...args) => $options.openPopup && $options.openPopup(...args)),
    e: common_vendor.o((...args) => $options.closePopup && $options.closePopup(...args)),
    f: common_vendor.f($data.incenseTypeList, (item, k0, i0) => {
      return {
        a: common_vendor.t(item.label),
        b: $data.selectedIncenseType === item.value ? 1 : "",
        c: item.value,
        d: common_vendor.o(($event) => $options.selectIncenseType(item.value), item.value)
      };
    }),
    g: $data.donationAmount,
    h: common_vendor.o(($event) => $data.donationAmount = $event.detail.value),
    i: common_vendor.f($data.quickAmountList, (item, k0, i0) => {
      return {
        a: common_vendor.t(item),
        b: $data.donationAmount == item ? 1 : "",
        c: item,
        d: common_vendor.o(($event) => $options.selectQuickAmount(item), item)
      };
    }),
    j: common_vendor.o((...args) => $options.closePopup && $options.closePopup(...args)),
    k: common_vendor.o((...args) => $options.confirmOffer && $options.confirmOffer(...args)),
    l: common_vendor.sr("incensePopup", "e5e4e616-1"),
    m: common_vendor.p({
      type: "center",
      isMaskClick: false
    }),
    n: common_vendor.o((...args) => $options.closeFirstVisitPopup && $options.closeFirstVisitPopup(...args)),
    o: common_vendor.sr("firstVisitPopup", "e5e4e616-2"),
    p: common_vendor.p({
      type: "center",
      isMaskClick: false
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-e5e4e616"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/secondPages/incense/incense.js.map
