<script lang="ts" setup>
import { type PageMeta, Pages } from "~/lib/constants"
import { onRetrievingGroup } from '~/lib/modules/GroupManaging/presentation/controllers/onRetrievingGroup'
import { PermissionStatuses } from '~/lib/modules/IdentityAndAccessManaging/dtos/PermissionStatuses'
import Center from '~/components/utils/Center.vue'
import { getAuth } from 'firebase/auth'
import { onJoiningGroup } from '~/lib/modules/GroupManaging/presentation/controllers/onJoiningGroup'
import NavigationDrawer from "~/components/groups/[groupId]/NavigationDrawer.vue"
import AppBar from "~/components/groups/[groupId]/AppBar.vue"
import { type RouteLocationNormalizedLoaded } from "vue-router"
import Snackbar from "~/components/utils/Snackbar.vue"
import { useSnackbar } from "~/composables/utils/useSnackbar"
import Confirm from "~/components/utils/Confirm.vue"
import { useConfirm } from "~/composables/utils/useConfirm"
import { withGroup, withPermission } from "~/lib/utils/sessions"

const route = useRoute()
const page = ref() as Ref<PageMeta>
const lookupPage = (route: RouteLocationNormalizedLoaded<string | symbol>) => {
    for (const page of Object.values(Pages)) {
        if (route.path === page.fullPath(route.params)) return page
    }
}
page.value = lookupPage(route)!
watch(route, (newOne, oldOne) => page.value = lookupPage(newOne)!)

definePageMeta({})

const { groupId } = route.params as { groupId: string }
const auth = getAuth()
const user = auth.currentUser!
const permission = withPermission()
const group = withGroup()
const permitted = computed(() => permission.value && permission.value.status === PermissionStatuses.Approved)

const onJoinButtonClicked = async () => {
    await onJoiningGroup(groupId)
    const payload = await onRetrievingGroup(groupId)
    if (!payload) return
    group.value = payload.group
    permission.value = payload.permission
}

const navigationDrawer = ref<InstanceType<typeof NavigationDrawer>>()
const snackbar = useSnackbar()
provide("snackbar", snackbar)
const confirm = useConfirm()
provide("confirm", confirm)
</script>

<template>
    <template v-if="group">
        <v-app>
            <Confirm ref="confirm" />
            <Snackbar ref="snackbar" />
            <template v-if="permitted">
                <NavigationDrawer ref="navigationDrawer" :user="user" :group="group" :permission="permission">
                </NavigationDrawer>
                <AppBar :toggle="navigationDrawer?.toggle" :title="page.title" :user="user"></AppBar>
                <v-main scrollable style="--v-layout-bottom: 0px;">
                    <NuxtPage />
                </v-main>
            </template>
            <template v-else>
                <template v-if="!permission">
                    <Center>
                        <h2>申請加入{{ group.name }}</h2>
                        <p><a href="javascript:void(0)" @click="() => onJoinButtonClicked()">點此</a>提出申請。</p>
                    </Center>
                </template>
                <template v-else-if="permission.status === PermissionStatuses.Rejected">
                    <Center>
                        <h2>您提出加入{{ group!.name }}的申請已被拒絕</h2>
                        <p>請聯絡管理員。</p>
                    </Center>
                </template>
                <template v-else-if="permission.status === PermissionStatuses.Pending">
                    <Center>
                        <h2>您所提出加入{{ group.name }}的申請正在等待審核</h2>
                        <p>請等待管理員審核。</p>
                    </Center>
                </template>
            </template>
        </v-app>
    </template>
</template>

<style scoped>
[v-cloak] {
    @apply hidden;
}

.v-application {
    background: #f0f2f5;
}

.v-main {
    min-height: calc(100vh - 64px);
}

:deep(.v-main__scroller) {
    position: relative;
}
</style>
