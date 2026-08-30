<template>
  <view class="container">
    <!-- #ifdef H5 -->
    <iframe class="site-frame" :src="siteUrl" title="南开问道网站" />
    <!-- #endif -->

    <!-- #ifndef H5 -->
    <web-view :src="siteUrl" />
    <!-- #endif -->
  </view>
</template>

<script setup>
const siteUrl = "http://47.100.116.121/";
</script>

<style>
.container,
.site-frame {
  width: 100%;
  height: 100dvh;
  border: 0;
}

.site-frame {
  display: block;
}
</style>
