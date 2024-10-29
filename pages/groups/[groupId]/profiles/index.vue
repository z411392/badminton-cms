<script lang="ts" setup>
import { Pages } from "~/lib/constants"
import { onCountingProfiles } from "~/lib/modules/ProfileManaging/presentation/controllers/onCountingProfiles"
import { PageSizes } from "~/lib/constants"
import { onListingProfiles, type ProfileEnriched } from "~/lib/modules/ProfileManaging/presentation/controllers/onListingProfiles"
import ProfileForm from "~/components/groups/[groupId]/profiles/ProfileForm.vue"
import { watchIgnorable } from "@vueuse/core"
import { type Level } from "~/lib/modules/LevelManaging/dtos/Level"
import { onListingLevels } from "~/lib/modules/LevelManaging/presentation/controllers/onListingLevels"
import TempVar from "vue-temp-var"
import SendingMessageDialog from "~/components/groups/[groupId]/profiles/SendingMessageDialog.vue"
import { copyTextToClipboard } from "~/lib/utils/ui"
import { showSuccess } from "~/composables/utils/useSnackbar"

definePageMeta({
    name: Pages.Profiles.name,
})

const itemsPerPage = PageSizes.Profiles
const itemLength = ref(0)
const loading = ref(false)
const items = ref([] as ProfileEnriched[])
const route = useRoute()
const { groupId } = route.params as { groupId: string }
const search = ref(String(route.query["search"] || ""))
const page = ref(Math.max(((route.query["page"] as any) >>> 0), 1))
const router = useRouter()

const headers = [
    {
        title: '成員',
        sortable: false,
        key: 'user',
        width: '240px',
    },
    {
        title: '',
        sortable: false,
        key: 'messaging',
        align: 'center' as 'center',
        width: '72px',
    },
    {
        title: '',
        sortable: false,
        key: 'ops',
        align: 'end' as 'end',
        width: '72px',
    },
]

const needToReset = ([newSearch, _, newLevelIds]: [string, number, string[]], [oldSearch, __, oldLevelIds]: [string | undefined, number | undefined, string[] | undefined]) => {
    if (typeof oldSearch === "undefined") return true
    if (typeof oldLevelIds === "undefined") return true
    if (newSearch !== oldSearch) return true
    if (newLevelIds.length !== oldLevelIds.length) return true
    const oldLevelIdsMap: { [levelId: string]: true } = {}
    for (const levelId of oldLevelIds) oldLevelIdsMap[levelId] = true
    for (const levelId of newLevelIds) if (oldLevelIdsMap[levelId]) delete oldLevelIdsMap[levelId]
    if (Object.keys(oldLevelIdsMap).length) return true
    return false
}

let ignoreUpdates: Function | undefined = undefined
const reset = async () => {
    ignoreUpdates?.(() => page.value = 1)
    itemLength.value = await onCountingProfiles(groupId, { search: search.value, levelIds: levelIdsSelected.value })
}

const stopRenewingQuery = ref<Function>()
const stopLoadingContent = ref<Function>()
onBeforeMount(() => {
    stopRenewingQuery.value = watch([page, search], ([page, search]) => router.push({ query: { page, search } }), { immediate: true, deep: true })
    const watchIgnorableReturn = watchIgnorable([search, page, levelIdsSelected], async (newOne, oldOne) => {
        if (needToReset(newOne, oldOne)) await reset()
        const [search, page, levelIdsSelected] = newOne
        loading.value = true
        items.value = await onListingProfiles(groupId, { page, search, levelIds: levelIdsSelected })
        loading.value = false
    }, { immediate: true, deep: true })
    ignoreUpdates = watchIgnorableReturn.ignoreUpdates
    stopLoadingContent.value = watchIgnorableReturn.stop
})

onBeforeUnmount(() => {
    stopRenewingQuery.value?.()
    stopLoadingContent.value?.()
})

const onOptionsUpdated = async (options: { page: number }) => {
    page.value = options.page
}

const reload = () => triggerRef(page)

const form = ref<InstanceType<typeof ProfileForm>>() as Ref<InstanceType<typeof ProfileForm>>

const levelsSelected = ref<Level[]>([])
const levelIdsSelected = computed(() => levelsSelected.value.map(({ id }) => id))
const levelIds = ref<string[]>([])
const levelsMap = ref<{ [levelId: string]: Level }>({})
const levels = computed({
    get: () => levelIds.value.map((levelId) => levelsMap.value[levelId]).filter((level) => Boolean(level)),
    set: (levels: Level[]) => {
        levelIds.value = []
        levelsMap.value = {}
        for (const level of levels) {
            if (typeof levelsMap.value[level.id] !== "undefined") continue
            levelsMap.value[level.id] = level
            levelIds.value.push(level.id)
        }
    },
})
onBeforeMount(async () => levels.value = await onListingLevels(groupId))
const levelItemTitle = (level: Level) => level.name
const levelItemValue = (level: Level) => level.id

const sendingMessageDialog = ref() as Ref<InstanceType<typeof SendingMessageDialog>>

const copyUserId = (userId: string) => {
    copyTextToClipboard(userId, () => showSuccess(`已複製使用者編號至剪貼簿`))
}
</script>

<template>
    <ProfileForm :groupId="groupId" :reload="reload" ref="form" />
    <SendingMessageDialog ref="sendingMessageDialog" :groupId="groupId" />
    <v-container>
        <v-card flat>
            <v-card-actions>
                <v-row dense>
                    <v-col dense :cols="12">
                        <v-text-field v-model="search" placeholder="關鍵字" prepend-inner-icon="mdi-magnify"
                            variant="solo-filled" flat hide-details density="compact" single-line />
                    </v-col>
                    <v-col dense :cols="12">
                        <v-select label="分級" v-model="levelsSelected" :items="levels" return-object
                            variant="solo-filled" flat chips multiple density="compact" :item-title="levelItemTitle"
                            :item-value="levelItemValue">
                            <template #item="{ props, item: { raw: { name, description, color } } }">
                                <v-list-item v-bind="props" :subtitle="description">
                                    <template #prepend>
                                        <v-icon icon="mdi-circle" :color="color" size="xs" />
                                    </template>
                                    <template #title>
                                        {{ name }}
                                    </template>
                                </v-list-item>
                            </template>
                        </v-select>
                    </v-col>
                </v-row>
            </v-card-actions>
            <v-divider />
            <v-data-table-server :items-per-page="itemsPerPage" :headers="headers" :items="items"
                :items-length="itemLength" :loading="loading" :search="search" item-value="id"
                @update:options="onOptionsUpdated" disable-items-per-page :page="page">
                <template #item.user="{ item: { user, name, levelId, line, userId } }">
                    <v-list>
                        <v-list-item>
                            <template #title>
                                {{ name }}
                            </template>
                            <template #subtitle>
                                {{ line }}
                            </template>
                            <template #prepend>
                                <template v-if="levelsMap[levelId]">
                                    <TempVar :define="{ level: levelsMap[levelId] }" #default="{ level: { color } }"
                                        v-if="levelsMap[levelId]">
                                        <v-badge :color="color" dot @click="() => copyUserId(userId)">
                                            <v-avatar :size="40">
                                                <template v-if="user.photoURL">
                                                    <v-img :src="user.photoURL">
                                                        <template #error>
                                                            <v-sheet style="line-height: 40px;">
                                                                {{ user.displayName.charAt(0) }}
                                                            </v-sheet>
                                                        </template>
                                                    </v-img>
                                                </template>
                                                <template v-else>
                                                    <v-sheet style="line-height: 40px;">
                                                        {{ user.displayName.charAt(0) }}
                                                    </v-sheet>
                                                </template>
                                            </v-avatar>
                                        </v-badge>
                                    </TempVar>
                                </template>
                            </template>
                        </v-list-item>
                    </v-list>
                </template>
                <template #item.messaging="{ item: { name, token } }">
                    <template v-if="token">
                        <v-btn icon="mdi-message" size="x-small" @click="() => sendingMessageDialog.open({ name, token })"/>
                    </template>
                </template>
                <template v-slot:item.ops="{ item: profile }: { item: ProfileEnriched }">
                    <v-menu>
                        <template v-slot:activator="{ props }">
                            <v-btn icon="mdi-dots-vertical" variant="text" v-bind="props"></v-btn>
                        </template>
                        <v-list>
                            <v-list-item @click="form.open(profile)">
                                <template #title>編輯</template>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </template>
            </v-data-table-server>
        </v-card>
    </v-container>
    <!-- <v-btn icon="mdi-plus" @click="form.open()" :class="$style['create']"></v-btn> -->
</template>

<style scoped module>
.create {
    @apply fixed right-4 bottom-4;
}
</style>

<style scoped>
:deep(table) {
    table-layout: fixed;
    width: 100% !important;
}
</style>