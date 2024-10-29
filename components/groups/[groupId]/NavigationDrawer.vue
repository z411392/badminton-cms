<script lang="ts" setup>
import { useWindowSize } from '@vueuse/core'
import { Pages } from '~/lib/constants'
import { Root } from '~/lib/constants'
import { type User } from "firebase/auth"
import { type Group } from '~/lib/modules/GroupManaging/dtos/Group'
import { type Permission } from '~/lib/modules/IdentityAndAccessManaging/dtos/Permission'
import { Roles } from '~/lib/modules/IdentityAndAccessManaging/dtos/Roles'

const { user, group, permission } = defineProps<{ user: User, group: Group, permission?: Permission }>()
const isRoot = user.uid === Root
const groupId = group.id
const displayingUsersMenuItem = computed(() => {
    if (isRoot) return true
    if (!permission) return false
    if (permission.role !== Roles.Owner) return false
    return true
})

const drawer = ref(true)
const permanent = ref(true)
const setDrawerState = () => {
    const { width: width } = useWindowSize()
    const onMobile = width.value <= 640
    drawer.value = !onMobile
    permanent.value = !onMobile
}
onMounted(() => {
    setDrawerState()
    window.onresize = setDrawerState
})

const abbreviationFor = (title: string) => {
    for (const charactor of title) return charactor
    return ""
}

const toggle = () => drawer.value = !drawer.value
defineExpose({
    toggle,
})
</script>

<template>
    <v-navigation-drawer v-model="drawer" :permanent="permanent" :width="282">
        <v-list>
            <v-list-item class="group" :title="group.name" @click="navigateTo(Pages.Groups.fullPath())">
                <template #prepend>
                    <v-avatar size="40">
                        <v-img cover :src="group.photoURL"></v-img>
                    </v-avatar>
                </template>
            </v-list-item>
            <v-divider></v-divider>
            <v-list-group>
                <template #activator="{ props }">
                    <v-list-item prepend-icon="mdi-calendar-clock" v-bind="props" title="球敘"></v-list-item>
                </template>
                <template v-if="isRoot">
                    <template v-for="{ title, fullPath } in [Pages.Venues, Pages.Shuttles]">
                        <v-list-item :title="title" :to="fullPath({ groupId })">
                            <template #prepend>{{ abbreviationFor(title) }}</template>
                        </v-list-item>
                    </template>
                </template>
                <template v-for="{ title, fullPath } in [Pages.Meetups]">
                    <v-list-item :title="title" :to="fullPath({ groupId })">
                        <template #prepend>{{ abbreviationFor(title) }}</template>
                    </v-list-item>
                </template>
            </v-list-group>
            <v-divider></v-divider>
            <v-list-group>
                <template #activator="{ props }">
                    <v-list-item prepend-icon="mdi-account-multiple" v-bind="props" title="球團"></v-list-item>
                </template>
                <template v-for="{ title, fullPath }
                    in
                    [
                        Pages.Levels,
                        // Pages.Tags,
                        Pages.Profiles, Pages.Playlists
                    ]">
                    <v-list-item :title="title" :to="fullPath({ groupId })">
                        <template #prepend>{{ abbreviationFor(title) }}</template>
                    </v-list-item>
                </template>
                <!-- <template v-if="displayingUsersMenuItem">
                    <v-list-item :title="Pages.Users.title" :to="Pages.Users.fullPath({ groupId })">
                        <template #prepend>{{ abbreviationFor(Pages.Users.title) }}</template>
                    </v-list-item>
                </template> -->
            </v-list-group>
        </v-list>
    </v-navigation-drawer>
</template>

<style scoped>
.v-navigation-drawer {
    @apply p-4 border-0 bg-transparent;
}

.v-navigation-drawer :deep(.v-navigation-drawer__content) {
    background-image: linear-gradient(195deg, #42424a, #191919);
    @apply rounded-xl p-6;
}

&.v-navigation-drawer--rail :deep(.v-navigation-drawer__content) {
    @apply px-1;
}

.v-navigation-drawer .v-list {
    @apply bg-transparent;
}

.v-navigation-drawer .v-list-item {
    @apply text-white cursor-pointer whitespace-nowrap;
}

.v-navigation-drawer .v-list-item-title {
    @apply text-sm;
}

.v-navigation-drawer .v-list-item-title.group {
    @apply font-bold text-base;
}

.v-navigation-drawer :deep(.v-list-group__items .v-list-item) {
    --indent-padding: 4px;
}

.v-navigation-drawer :deep(.v-list-item__prepend > .v-list-item__spacer) {
    width: 24px;
}

.v-navigation-drawer :deep(.v-list-item--variant-text .v-list-item__overlay) {
    background: transparent;
}

.v-navigation-drawer :deep(.v-list-item--variant-text:hover .v-list-item__overlay) {
    background: currentColor;
}

.v-divider {
    @apply my-3;
}
</style>