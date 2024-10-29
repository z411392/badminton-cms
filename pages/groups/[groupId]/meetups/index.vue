<script lang="ts" setup>
import { Pages } from "~/lib/constants"
import { onCountingMeetups } from "~/lib/modules/MeetupManaging/presentation/controllers/onCountingMeetups"
import { PageSizes } from "~/lib/constants"
import { onListingMeetups, type MeetupEnriched } from "~/lib/modules/MeetupManaging/presentation/controllers/onListingMeetups"
import MeetupForm from "~/components/groups/[groupId]/meetups/MeetupForm.vue"
import { performConfirm } from "~/composables/utils/useConfirm"
import { onRemovingMeetup } from "~/lib/modules/MeetupManaging/presentation/controllers/onRemovingMeetup"
import { watchIgnorable } from "@vueuse/core"
import { copyTextToClipboard } from "~/lib/utils/ui"
import { showSuccess } from "~/composables/utils/useSnackbar"
import { DateTime } from "luxon"
import { DatetimeFormats } from "~/lib/constants"

definePageMeta({
    name: Pages.Meetups.name,
})

const itemsPerPage = PageSizes.Meetups
const itemLength = ref(0)
const loading = ref(false)
const items = ref([] as MeetupEnriched[])
const route = useRoute()
const { groupId } = route.params as { groupId: string }
const search = ref(String(route.query["search"] || ""))
const page = ref(Math.max(((route.query["page"] as any) >>> 0), 1))
const router = useRouter()

const headers = [
    {
        title: '標題',
        sortable: false,
        key: 'name',
    },
    {
        title: '日期',
        sortable: false,
        key: 'date',
    },
    {
        title: '',
        sortable: false,
        key: 'ops',
        align: 'end' as 'end',
    },
]

const needToReset = ([newSearch]: [string, number], [oldSearch]: [string | undefined, number | undefined]) => {
    if (typeof oldSearch === "undefined") return true
    if (newSearch !== oldSearch) return true
    return false
}

let ignoreUpdates: Function | undefined = undefined
const reset = async () => {
    ignoreUpdates?.(() => page.value = 1)
    itemLength.value = await onCountingMeetups(groupId, { search: search.value })
}

const stopRenewingQuery = ref<Function>()
const stopLoadingContent = ref<Function>()
onBeforeMount(() => {
    stopRenewingQuery.value = watch([page, search], ([page, search]) => router.push({ query: { page, search } }), { immediate: true, deep: true })
    const watchIgnorableReturn = watchIgnorable([search, page], async (newOne, oldOne) => {
        if (needToReset(newOne, oldOne)) await reset()
        const [search, page] = newOne
        loading.value = true
        items.value = await onListingMeetups(groupId, { page, search })
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
const form = ref<InstanceType<typeof MeetupForm>>() as Ref<InstanceType<typeof MeetupForm>>
const onDeleteButtonClicked = (meetupId: string) => performConfirm(
    `刪除球敘`,
    `確定要刪除嗎？`,
    async () => {
        await onRemovingMeetup(groupId, meetupId)
        reload()
    },
)

const toSignUps = async (meetup: MeetupEnriched) => {
    const { data } = useNuxtData<MeetupEnriched>("meetup")
    data.value = meetup
    const meetupId = meetup.id
    await navigateTo(Pages.SignUps.fullPath({ groupId, meetupId }))
}

const copyPublicURL = async (meetupId: string) => {
    const { public: { publicURL } } = useRuntimeConfig()
    await copyTextToClipboard(`${publicURL}/groups/${groupId}/meetups/${meetupId}`, () => showSuccess(`已複製報名網址到剪貼簿`))
}
const duplicate = async ({ date: originalDate, ...rest }: MeetupEnriched) => {
    const date = DateTime.fromFormat(originalDate, DatetimeFormats.ISO8601DATE).plus({ days: 7 }).toFormat(DatetimeFormats.ISO8601DATE)
    form.value.open({
        ...rest,
        date
    }, true)
}
</script>

<template>
    <MeetupForm :groupId="groupId" :reload="reload" ref="form" />
    <v-container>
        <v-card flat>
            <v-card-actions>
                <v-text-field v-model="search" placeholder="關鍵字" prepend-inner-icon="mdi-magnify" variant="solo-filled"
                    flat hide-details density="compact" single-line />
            </v-card-actions>
            <v-divider />
            <v-data-table-server :items-per-page="itemsPerPage" :headers="headers" :items="items"
                :items-length="itemLength" :loading="loading" :search="search" item-value="id"
                @update:options="onOptionsUpdated" disable-items-per-page :page="page">
                <template v-slot:item.name="{ item: meetup }: { item: MeetupEnriched }">
                    <v-btn variant="plain" flat @click="toSignUps(meetup)">
                        {{ meetup.name }}
                    </v-btn>
                </template>
                <template v-slot:item.ops="{ item: meetup }: { item: MeetupEnriched }">
                    <v-menu>
                        <template v-slot:activator="{ props }">
                            <v-btn icon="mdi-dots-vertical" variant="text" v-bind="props"></v-btn>
                        </template>
                        <v-list>
                            <v-list-item @click="form.open(meetup)">
                                <template #title>編輯</template>
                            </v-list-item>
                            <v-list-item @click="() => onDeleteButtonClicked(meetup.id)">
                                <template #title>刪除</template>
                            </v-list-item>
                            <v-list-item @click="() => copyPublicURL(meetup.id)">
                                <template #title>取得連結</template>
                            </v-list-item>
                            <v-list-item @click="() => duplicate(meetup)">
                                <template #title>複製</template>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </template>
            </v-data-table-server>
        </v-card>
    </v-container>
    <v-btn icon="mdi-plus" @click="form.open()" :class="$style['create']"></v-btn>
</template>

<style scoped module>
.create {
    @apply fixed right-4 bottom-4;
}
</style>