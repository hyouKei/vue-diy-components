<template>
  <!-- 基于elementUI 制作万年历选择器 -->
  <div class="page-content page-calendar">
    <div class="single-panel">
      <p>面板</p>
      <calendar
        ref="calendarRef"
        :range="calendarConfig.range"
        :value="calendarConfig.value"
        :lunar="calendarConfig.lunar"
        :begin="calendarConfig.begin"
        :end="calendarConfig.end"
        @select="calendarSelect"
      ></calendar>
    </div>
    <!-- demo -->
    <div
      class="inline-box calendar-box-inner"
      :style="{ width: inputWidth + 'px' }"
    >
      <p>基于 ElementUI 文本框下拉</p>
      <el-popover
        placement="bottom"
        :width="Number(inputWidth) - 20"
        :visible-arrow="false"
        trigger="click"
        @show="initCalendar"
      >
        <calendar
          ref="calendarRef"
          :range="calendarConfig.range"
          :value="calendarConfig.value"
          :lunar="calendarConfig.lunar"
          :begin="calendarConfig.begin"
          :end="calendarConfig.end"
          @select="calendarSelect"
        ></calendar>
        <el-input v-model="inputDate" readonly slot="reference"></el-input>
      </el-popover>
    </div>
    <div class="inline-box lunar-info-box">
      <p>日历详情</p>
      <el-form
        class="calendar-detail-list"
        :model="lunarData"
        label-position="left"
        label-width="140px"
        v-if="lunarData"
      >
        <el-form-item label="公历日：">
          <span
            >{{ lunarData.lunarInfo.cYear }}年{{
              lunarData.lunarInfo.cMonth
            }}月{{ lunarData.lunarInfo.cDay }}日</span
          >
        </el-form-item>
        <el-form-item label="农历日：">
          <span>{{ lunarData.lunar }}</span>
          <span
            >({{ lunarData.lunarInfo.IMonthCn
            }}{{ lunarData.lunarInfo.IDayCn }})</span
          >
        </el-form-item>

        <el-form-item label="公历节日：">
          <span>{{ lunarData.isGregorianFestival }}</span>
        </el-form-item>
        <el-form-item label="农历节日：">
          <span>{{ lunarData.isLunarFestival }}</span>
        </el-form-item>
        <el-form-item label="生肖：">
          <span>{{ lunarData.lunarInfo.Animal }}</span>
        </el-form-item>
        <el-form-item label="节日：">
          <span>{{ lunarData.lunar }}</span>
        </el-form-item>

        <el-form-item label="是否为节气：">
          <span>{{ lunarData.lunarInfo.isTerm }}</span>
        </el-form-item>
        <el-form-item label="节气：">
          <span>{{ lunarData.lunarInfo.Term || '--' }}</span>
        </el-form-item>

        <el-form-item label="是否今日：">
          <span>{{ lunarData.lunarInfo.isToday }}</span>
        </el-form-item>
        <el-form-item label="是否闰年：">
          <span>{{ lunarData.lunarInfo.isLeap }}</span>
        </el-form-item>

        <el-form-item label="天干地支（年）：">
          <span>{{ lunarData.lunarInfo.gzYear }}</span>
        </el-form-item>
        <el-form-item label="天干地支（月）：">
          <span>{{ lunarData.lunarInfo.gzMonth }}</span>
        </el-form-item>
        <el-form-item label="天干地支（日）：">
          <span>{{ lunarData.lunarInfo.gzDay }}</span>
        </el-form-item>

        <el-form-item label="星期：">
          <span>{{ lunarData.lunarInfo.ncWeek }}</span>
        </el-form-item>
        <el-form-item label="星座：">
          <span>{{ lunarData.lunarInfo.astro }}</span>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'calendar-all',
  // components: { calendar },
  data() {
    return {
      calendarConfig: {
        range: false, // 是否可选区间
        value: [], // 默认日期
        lunar: true, // 显示农历
        begin: [], // 可选开始日期
        end: [] // 可选结束日期
      },

      inputWidth: 320,
      inputDate: '', // 单个选择

      lunarData: null
      // lunarInfo: null
    }
  },

  methods: {
    calendarSelect(begin, end) {
      console.log(end)
      this.inputDate = this.$refs.calendarRef.getCurrentDateFormat(
        'YYYY-MM-DD',
        begin
      )
      this.lunarData = this.$refs.calendarRef.getLunarInfo(
        begin[0],
        begin[1],
        begin[2]
      )
    },

    // 显示万年历面板 初始化 根据 input value
    initCalendar() {
      // if (!this.inputDate) {
      // } else {
      //   // this.$refs.calendarRef.init()
      // }
    }
  },

  mounted() {
    this.inputDate = this.$refs.calendarRef.getCurrentDateFormat('YYYY-MM-DD')

    this.lunarData = this.$refs.calendarRef.getLunarInfo()
    // this.debounceChange = _.debounce(this.debounceChange, 300)
  }
}
</script>

<style lang="less" scoped>
.single-panel {
  width: 420px;
  display: inline-block;
  margin-right: 70px;

  p {
    margin-top: 0;
  }
}
.inline-box {
  display: inline-block;
  vertical-align: top;
  margin-right: 15px;
  // max-width: 600px;

  p {
    margin-top: 0;
  }
}

.lunar-info-box {
  position: absolute;
  right: 0;
  width: 600px;
  top: 140px;

  .el-form-item {
    margin-bottom: 0;
  }
}
</style>
