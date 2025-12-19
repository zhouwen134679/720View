<template>
	<view class="incense-page">
		<!-- 页面返回头部组件 -->
		<pageBack :titleInfo="titleInfo"></pageBack>

		<!-- 新增：实时滚动公告栏 -->
		<view class="scroll-notice">
			<view class="notice-content" :style="{ animationDuration: scrollDuration + 's' }">
				<text class="notice-icon">🔥</text>
				<text class="notice-text" v-for="(item, index) in noticeList" :key="index">
					{{ item }}
				</text>
			</view>
		</view>

		<!-- 背景图 -->
		<image src="http://t73sifiwt.hn-bkt.clouddn.com/index/bf_bg.png" class="bg-img" mode="aspectFill"></image>

		<!-- 内容区域 -->
		<view class="content">
			<!-- 人物图片 -->
			<view class="hero">
				<image src="http://t73sifiwt.hn-bkt.clouddn.com/index/fox18.jpg" mode="aspectFit"></image>
			</view>

			<!-- 桌子图片 -->
			<view class="zhuozi">
				<image class="xiang" src="http://t73sifiwt.hn-bkt.clouddn.com/index/burner.gif" mode="widthFix">
				</image>
				<image src="http://t73sifiwt.hn-bkt.clouddn.com/index/zhuozi.png" mode="widthFix"></image>
				<view class="fruits">
					<image src="http://t73sifiwt.hn-bkt.clouddn.com/index/fruits.webp" mode="widthFix"></image>
					<image src="http://t73sifiwt.hn-bkt.clouddn.com/index/fruits.webp" mode="widthFix"></image>
				</view>
				<view class="flower">
					<image src="http://t73sifiwt.hn-bkt.clouddn.com/index/flower.webp" mode="widthFix"></image>
					<image src="http://t73sifiwt.hn-bkt.clouddn.com/index/flower.webp" mode="widthFix"></image>
				</view>
			</view>

			<!-- 供奉香火按钮 -->
			<view class="offer-btn" @click="openPopup">
				<text>供奉香火</text>
			</view>
		</view>

		<!-- 供奉香火弹窗 -->
		<uni-popup ref="incensePopup" type="center" :isMaskClick="false">
			<view class="incense-popup">
				<view class="popup-header">
					<text class="popup-title">供奉香火</text>
					<text class="popup-close" @click="closePopup">×</text>
				</view>
				<view class="popup-content">
					<!-- 上香类型选择 -->
					<view class="incense-type-section">
						<text class="section-title">选择香火类型</text>
						<view class="incense-type-list">
							<view class="incense-type-item" :class="{ active: selectedIncenseType === item.value }"
								v-for="item in incenseTypeList" :key="item.value"
								@click="selectIncenseType(item.value)">
								<text>{{ item.label }}</text>
							</view>
						</view>
					</view>

					<!-- 捐献金额输入 -->
					<view class="donation-section">
						<text class="section-title">捐献金额（元）</text>
						<view class="donation-input-wrapper">
							<text class="currency-symbol">￥</text>
							<input class="donation-input" type="digit" v-model="donationAmount" placeholder="请输入捐献金额"
								:maxlength="10" />
						</view>
						<!-- 快捷金额选择 -->
						<view class="quick-amount-list">
							<view class="quick-amount-item" :class="{ active: donationAmount == item }"
								v-for="item in quickAmountList" :key="item" @click="selectQuickAmount(item)">
								<text>￥{{ item }}</text>
							</view>
						</view>
					</view>
				</view>
				<view class="popup-footer">
					<view class="popup-btn cancel-btn" @click="closePopup">取消</view>
					<view class="popup-btn confirm-btn" @click="confirmOffer">确定</view>
				</view>
			</view>
		</uni-popup>

		<!-- 首次进入提示弹窗 -->
		<uni-popup ref="firstVisitPopup" type="center" :isMaskClick="false">
			<view class="first-visit-popup">
				<view class="popup-header">
					<text class="popup-title">证书奖励提示</text>
				</view>
				<view class="popup-content">
					<text class="popup-icon">🏆</text>
					<text class="popup-text">累计捐献香火值达到 5000 点，即可获得专属电子证书！</text>
					<text class="popup-text small">证书将在"我的证书"页面展示，见证您的虔诚与功德</text>
				</view>
				<view class="popup-footer">
					<view class="popup-btn" @click="closeFirstVisitPopup">我知道了</view>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	// 引入返回头部组件
	import pageBack from '/components/title/title.vue';
	import {
		useUserInfoStore
	} from "@/store/userInfo.js";
	import {
		incensePayAPI
	} from "@/apis/user.js";

	export default {
		name: 'IncensePage',
		components: {
			pageBack
		},
		data() {
			return {
				// 头部标题配置
				titleInfo: {
					titleShow: true,
					title: '电子上香',
					imageUrl: 'http://t73sifiwt.hn-bkt.clouddn.com/pageBack/3.webp',
					heightShow: false,
					backShow: true
				},
				// 选中的香火类型
				selectedIncenseType: '',
				// 捐献金额
				donationAmount: '',
				// 香火类型列表
				incenseTypeList: [{
						label: '普通香',
						value: 'normal'
					},
					{
						label: '高香',
						value: 'high'
					},
					{
						label: '檀香',
						value: 'sandalwood'
					},
					{
						label: '沉香',
						value: 'agarwood'
					}
				],
				// 快捷金额列表
				quickAmountList: [9, 19, 29, 39, 99, 199],
				// 新增：滚动公告相关
				noticeList: [], // 公告列表
				scrollDuration: 30, // 滚动动画时长
				noticeTimer: null, // 定时器
				// 模拟用户昵称池
				nicknamePool: ['清风居士', '善男信女', '随缘客', '静心人', '福运君', '平安客', '吉祥翁', '如意姑']
			};
		},
		onLoad() {
			// 初始化公告列表
			this.initNoticeList();
			// 启动定时更新公告
			this.startNoticeTimer();
			// 检查是否首次进入
			this.checkFirstVisit();
		},
		onUnload() {
			// 清除定时器，防止内存泄漏
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
				const hasVisited = uni.getStorageSync('incense_first_visit');
				if (!hasVisited) {
					// 首次进入，显示弹窗
					setTimeout(() => {
						this.$refs.firstVisitPopup.open();
					}, 300);
				}
			},
			/**
			 * 关闭首次进入弹窗
			 */
			closeFirstVisitPopup() {
				// 标记已访问
				uni.setStorageSync('incense_first_visit', true);
				this.$refs.firstVisitPopup.close();
			},
			/**
			 * 新增：初始化公告列表
			 */
			initNoticeList() {
				// 初始化5条模拟数据
				for (let i = 0; i < 5; i++) {
					this.addNewNotice();
				}
			},
			/**
			 * 新增：添加新的公告
			 */
			addNewNotice() {
				// 随机选择昵称
				const randomNickname = this.nicknamePool[Math.floor(Math.random() * this.nicknamePool.length)];
				// 随机选择香火类型
				const randomIncense = this.incenseTypeList[Math.floor(Math.random() * this.incenseTypeList.length)].label;
				// 随机金额
				const randomAmount = this.quickAmountList[Math.floor(Math.random() * this.quickAmountList.length)];
				// 构建公告文本
				const noticeText = `${randomNickname} 供奉了${randomIncense}，捐献￥${randomAmount} `;
				// 添加到公告列表
				this.noticeList.unshift(noticeText);
				// 限制列表长度，保持性能
				if (this.noticeList.length > 10) {
					this.noticeList.pop();
				}
			},
			/**
			 * 新增：启动公告定时器
			 */
			startNoticeTimer() {
				// 每5-10秒随机添加一条新公告
				this.noticeTimer = setInterval(() => {
					this.addNewNotice();
					// 随机调整滚动速度，增加真实感
					this.scrollDuration = 25 + Math.random() * 10;
				}, 5000 + Math.random() * 5000);
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
				// 重置数据
				this.selectedIncenseType = '';
				this.donationAmount = '';
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
				const store = useUserInfoStore();
				if (!store.$state.userInfo.id) {
					return uni.showModal({
						title: "请先登录",
						content: "登录后才可以供奉香火并累计香火值",
						showCancel: false,
						success: () => {
							uni.navigateTo({
								url: "/pages/login/login"
							});
						}
					});
				}

				// 验证是否选择了香火类型
				if (!this.selectedIncenseType) {
					uni.showToast({
						title: '请选择香火类型',
						icon: 'none',
						duration: 2000
					});
					return;
				}

				// 验证是否输入了金额
				if (!this.donationAmount || parseFloat(this.donationAmount) <= 0) {
					uni.showToast({
						title: '请输入捐献金额',
						icon: 'none',
						duration: 2000
					});
					return;
				}

				// 验证金额格式
				const amount = parseFloat(this.donationAmount);
				if (isNaN(amount) || amount <= 0) {
					uni.showToast({
						title: '请输入有效的金额',
						icon: 'none',
						duration: 2000
					});
					return;
				}

				// 获取选中的香火类型名称
				const selectedType = this.incenseTypeList.find(item => item.value === this.selectedIncenseType);

				// 模拟微信支付 + 累积香火值
				uni.showLoading({
					title: "微信支付中",
					mask: true
				});
				setTimeout(() => {
					incensePayAPI({
						user_id: store.$state.userInfo.id,
						amount
					}).then((res) => {
						uni.hideLoading();
						if (res.status === 200) {
							// 更新本地香火值
							store.$state.userInfo.balance = res.newBalance;

							// 新增：将当前用户的捐献信息添加到滚动公告
							const userNotice = `您 供奉了${selectedType ? selectedType.label : '香火'}，捐献￥${amount} ，香火值已入账`;
							this.noticeList.unshift(userNotice);
							if (this.noticeList.length > 10) {
								this.noticeList.pop();
							}

							uni.showToast({
								title: `已供奉${selectedType ? selectedType.label : '香火'}，香火值+${amount}`,
								icon: 'success',
								duration: 2500
							});
							// 关闭弹窗
							this.closePopup();
							// 调用原有的上香方法
							this.offerIncense();
						} else {
							uni.showToast({
								title: res.message || "支付失败，请重试",
								icon: "none"
							});
						}
					}).catch(() => {
						uni.hideLoading();
						uni.showToast({
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
				// 这个方法保留，如果后续有动画或其他逻辑可以在这里添加
			}
		}
	};
</script>

<style lang="less" scoped>
	// 页面整体样式
	.incense-page {
		background-color: #fffbf2;
		height: 100vh;
		overflow: hidden;
	}

	// 新增：滚动公告样式
	.scroll-notice {
		top: 200rpx;
		position: relative;
		width: 100%;
		height: 60rpx;
		line-height: 60rpx;
		overflow: hidden;
		z-index: 9;

		.notice-content {
			position: absolute;
			left: 100%;
			top: 0;
			white-space: nowrap;
			display: flex;
			align-items: center;
			animation: scrollLeft linear infinite;

			.notice-icon {
				font-size: 28rpx;
				margin-right: 16rpx;
				animation: flame 1.5s infinite alternate;
			}

			.notice-text {
				font-size: 26rpx;
				color: #b87d45;
				margin-right: 32rpx;
				letter-spacing: 1rpx;
			}
		}
	}

	// 新增：滚动动画
	@keyframes scrollLeft {
		0% {
			transform: translateX(0);
		}

		100% {
			transform: translateX(-100%);
		}
	}

	// 新增：火焰动画
	@keyframes flame {
		0% {
			transform: scale(1);
			opacity: 0.8;
		}

		100% {
			transform: scale(1.2);
			opacity: 1;
		}
	}

	// 背景图样式
	.bg-img {
		position: absolute;
		top: 200rpx;
		left: 0;
		width: 100vw;
		height: calc(100vh - 200rpx);
	}

	// 内容区域样式
	.content {
		position: relative;
		top: 200rpx;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: calc(100vh - 200rpx);
		padding-bottom: 120rpx;
	}

	// 人物图片容器样式
	.hero {
		display: flex;
		justify-content: center;
		width: 100%;
		padding: 50rpx 0;
		overflow: hidden;

		image {
			height: 500rpx;
		}
	}

	// 桌子图片容器样式
	.zhuozi {
		position: relative;
		display: flex;
		justify-content: center;
		width: 100%;
		padding: 100rpx 0;

		.xiang {
			left: 50%;
			transform: translateX(-50%);
			top: -27%;
			width: 40%;
			position: absolute;
		}

		.fruits {
			image {
				top: 22%;
				left: 20%;
				position: absolute;
				width: 20%;
			}

			image:nth-child(1) {
				left: 60%;
			}
		}

		.flower {
			image {
				top: -10%;
				left: 10%;
				position: absolute;
				width: 20%;
			}

			image:nth-child(1) {
				left: 70%;
			}
		}
	}

	// 供奉香火按钮样式
	.offer-btn {
		position: fixed;
		bottom: 60rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 280rpx;
		height: 80rpx;
		background: linear-gradient(135deg, #d4a574 0%, #c8965e 100%);
		border-radius: 40rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 20rpx rgba(196, 150, 94, 0.3);
		z-index: 10;

		text {
			color: #fff;
			font-size: 32rpx;
			font-weight: 600;
			letter-spacing: 2rpx;
		}

		&:active {
			opacity: 0.8;
			transform: translateX(-50%) scale(0.98);
		}
	}

	// 弹窗样式
	.incense-popup {
		width: 100%;
		background: #fff;
		border-radius: 24rpx;
		overflow: hidden;
		box-shadow: 0 10rpx 40rpx rgba(0, 0, 0, 0.15);
		display: flex;
		flex-direction: column;

		.popup-header {
			position: relative;
			height: 100rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			background: linear-gradient(135deg, #d4a574 0%, #c8965e 100%);
			border-bottom: 1rpx solid rgba(255, 255, 255, 0.2);
			flex-shrink: 0;

			.popup-title {
				color: #fff;
				font-size: 36rpx;
				font-weight: 600;
			}

			.popup-close {
				position: absolute;
				right: 30rpx;
				color: #fff;
				font-size: 50rpx;
				line-height: 1;
				width: 50rpx;
				height: 50rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				cursor: pointer;

				&:active {
					opacity: 0.8;
				}
			}
		}

		.popup-content {
			padding: 40rpx 30rpx;
			flex: 1;
			overflow-y: auto;
			box-sizing: border-box;

			.section-title {
				display: block;
				color: #333;
				font-size: 28rpx;
				font-weight: 600;
				margin-bottom: 24rpx;
			}

			// 香火类型选择
			.incense-type-section {
				margin-bottom: 40rpx;

				.incense-type-list {
					display: flex;
					flex-wrap: wrap;
					margin: -8rpx;

					.incense-type-item {
						width: calc(50% - 16rpx);
						height: 80rpx;
						margin: 8rpx;
						display: flex;
						align-items: center;
						justify-content: center;
						background: #f5f5f5;
						border-radius: 12rpx;
						border: 2rpx solid transparent;
						transition: all 0.3s;
						box-sizing: border-box;

						text {
							color: #666;
							font-size: 28rpx;
						}

						&.active {
							background: linear-gradient(135deg, #d4a574 0%, #c8965e 100%);
							border-color: #c8965e;

							text {
								color: #fff;
								font-weight: 600;
							}
						}

						&:active {
							transform: scale(0.98);
						}
					}
				}
			}

			// 捐献金额输入
			.donation-section {
				.donation-input-wrapper {
					display: flex;
					align-items: center;
					height: 88rpx;
					background: #f8f8f8;
					border-radius: 12rpx;
					padding: 0 24rpx;
					margin-bottom: 24rpx;
					border: 2rpx solid #e8e8e8;
					box-sizing: border-box;

					.currency-symbol {
						color: #d4a574;
						font-size: 32rpx;
						font-weight: 600;
						margin-right: 12rpx;
						flex-shrink: 0;
					}

					.donation-input {
						flex: 1;
						height: 100%;
						color: #333;
						font-size: 32rpx;
						background: transparent;
						border: none;
						outline: none;
					}
				}

				.quick-amount-list {
					display: flex;
					flex-wrap: wrap;
					margin: -6rpx;

					.quick-amount-item {
						width: calc(33.333% - 12rpx);
						height: 64rpx;
						margin: 6rpx;
						display: flex;
						align-items: center;
						justify-content: center;
						background: #f5f5f5;
						border-radius: 10rpx;
						border: 2rpx solid transparent;
						transition: all 0.3s;
						box-sizing: border-box;

						text {
							color: #666;
							font-size: 24rpx;
						}

						&.active {
							background: #fff5e8;
							border-color: #d4a574;

							text {
								color: #d4a574;
								font-weight: 600;
							}
						}

						&:active {
							transform: scale(0.98);
						}
					}
				}
			}
		}

		.popup-footer {
			display: flex;
			border-top: 1rpx solid #eee;
			flex-shrink: 0;

			.popup-btn {
				flex: 1;
				height: 100rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 32rpx;
				font-weight: 600;
				transition: all 0.2s;

				&.cancel-btn {
					color: #666;
					border-right: 1rpx solid #eee;
					background: #fff;

					&:active {
						background: #f5f5f5;
					}
				}

				&.confirm-btn {
					color: #fff;
					background: linear-gradient(135deg, #d4a574 0%, #c8965e 100%);

					&:active {
						opacity: 0.8;
					}
				}
			}
		}
	}

	// 首次进入弹窗样式
	.first-visit-popup {
		width: 600rpx;
		background: #fff;
		border-radius: 24rpx;
		overflow: hidden;
		box-shadow: 0 10rpx 40rpx rgba(0, 0, 0, 0.15);

		.popup-header {
			height: 100rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			background: linear-gradient(135deg, #d4a574 0%, #c8965e 100%);
			border-bottom: 1rpx solid rgba(255, 255, 255, 0.2);

			.popup-title {
				color: #fff;
				font-size: 36rpx;
				font-weight: 600;
			}
		}

		.popup-content {
			padding: 40rpx 30rpx;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			min-height: 250rpx;

			.popup-icon {
				font-size: 80rpx;
				margin-bottom: 20rpx;
			}

			.popup-text {
				color: #333;
				font-size: 28rpx;
				line-height: 1.8;
				text-align: center;
				margin-bottom: 15rpx;
				font-weight: 500;

				&.small {
					font-size: 24rpx;
					color: #999;
					font-weight: normal;
				}

				&:last-child {
					margin-bottom: 0;
				}
			}
		}

		.popup-footer {
			border-top: 1rpx solid #eee;

			.popup-btn {
				height: 100rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 32rpx;
				font-weight: 600;
				color: #fff;
				background: linear-gradient(135deg, #d4a574 0%, #c8965e 100%);
				transition: all 0.2s;

				&:active {
					opacity: 0.8;
				}
			}
		}
	}
</style>