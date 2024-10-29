<script lang="ts" setup>
import { Pages } from '~/lib/constants'
const route = useRoute()
const { groupId } = route.params as { groupId: string }
await navigateTo(Pages.Meetups.fullPath({ groupId }))
</script>

<template></template>