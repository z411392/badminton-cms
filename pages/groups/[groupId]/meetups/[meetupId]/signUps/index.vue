<script lang="ts" setup>
import { Pages } from "~/lib/constants"
import { PageSizes } from "~/lib/constants"
import { withMeetup } from "~/lib/utils/sessions"
import TempVar from "vue-temp-var"
import { SignUpStatuses } from "~/lib/modules/SignUpManaging/dtos/SignUpStatuses"
import SignUpStats from "~/components/groups/[groupId]/meetups/[meetupId]/signUps/SignUpStats.vue"
import { type Level } from "~/lib/modules/LevelManaging/dtos/Level"
import { useLevels } from "~/composables/groups/[groupId]/meetups/[meetupId]/signUps/useLevels"
import { useSignUps } from "~/composables/groups/[groupId]/meetups/[meetupId]/signUps/useSignUps"
import { onReviewingSignUp } from "~/lib/modules/SignUpManaging/presentation/controllers/onReviewingSignUp"
import { getAuth } from "firebase/auth"
import { fromJsonToXlsxBlob } from "~/lib/utils/formatters"
import { copyTextToClipboard, downloadBlob } from "~/lib/utils/ui"
import { showSuccess } from "~/composables/utils/useSnackbar"
import SendingMessageDialog from "~/components/groups/[groupId]/profiles/SendingMessageDialog.vue"


definePageMeta({
    name: Pages.SignUps.name,
})

const itemsPerPage = PageSizes.Unlimited
const itemLength = ref(0)
const loading = ref(false)
const route = useRoute()
const { groupId, meetupId } = route.params as { groupId: string, meetupId: string }
const search = ref(String(route.query["search"] || ""))

const meetup = withMeetup()
const headers = computed(() => {
    const headers = function* () {
        yield {
            title: '序號',
            sortable: false,
            key: 'order',
            width: '72px',
            align: 'end' as 'end',
        }
        yield {
            title: '成員',
            sortable: false,
            key: 'user',
            width: '240px',
        }
        yield {
            title: '',
            sortable: false,
            key: 'messaging',
            align: 'center' as 'center',
            width: '72px',
        }
        yield {
            title: '',
            sortable: false,
            key: 'markAsPaid',
            width: '72px',
            align: 'center' as 'center',
        }
        for (const { id: timeslotId } of meetup.value.timeslots) {
            yield {
                sortable: false,
                key: timeslotId,
                width: '72px',
                align: 'center' as 'center',
            }
        }
    }
    return Array.from(headers())
})

const user = getAuth().currentUser!
const userId = user.uid

const { signUps, levelsStats, attendingsStats, signUpIdOf, loadingsMap } = useSignUps({ groupId, meetupId, userId })

const items = computed(() => signUps.value.filter(({ user, profile, statuses }) => {
    if (levelIdsSelected.value.length) {
        if (!levelIdsSelected.value.includes(profile.levelId)) return false
    }
    if (!search.value) return true
    if (user.displayName.includes(search.value)) return true
    if (profile.name.includes(search.value)) return true
    if (profile.line.includes(search.value)) return true
    return false
}))

const payable = (userId: string, statuses: { [timeslotId: string]: SignUpStatuses }) => {
    for (const timeslotId in statuses) {
        if (statuses[timeslotId] === SignUpStatuses.Accepted) return true
    }
    return false
}

const onMarkAsPaidButtonClicked = async (userId: string, statuses: { [timeslotId: string]: SignUpStatuses }) => {
    const promises: Promise<any>[] = []
    for (const timeslotId in statuses) {
        if (statuses[timeslotId] !== SignUpStatuses.Accepted) continue
        const signUpId = signUpIdOf(userId, timeslotId)!
        const status = SignUpStatuses.Paid
        loadingsMap.value[signUpId] = true
        promises.push(onReviewingSignUp(groupId, meetupId, timeslotId, signUpId, { status }))
    }
    await Promise.all(promises)
}

const onAcceptedButtonClicked = async (userId: string, timeslotId: string) => {
    const signUpId = signUpIdOf(userId, timeslotId)!
    loadingsMap.value[signUpId] = true
    const status = SignUpStatuses.Accepted
    await onReviewingSignUp(groupId, meetupId, timeslotId, signUpId, { status })
}

const onRevokeButtonClicked = async (userId: string, timeslotId: string) => {
    const signUpId = signUpIdOf(userId, timeslotId)!
    loadingsMap.value[signUpId] = true
    const status = SignUpStatuses.Revoked
    await onReviewingSignUp(groupId, meetupId, timeslotId, signUpId, { status })
}

const onMarkAsRefunedButtonClicked = async (userId: string, timeslotId: string) => {
    const signUpId = signUpIdOf(userId, timeslotId)!
    loadingsMap.value[signUpId] = true
    const status = SignUpStatuses.Refunded
    await onReviewingSignUp(groupId, meetupId, timeslotId, signUpId, { status })
}

const { levelIdsSelected, levelsSelected, levels, levelsMap } = useLevels(groupId)
const levelItemTitle = (level: Level) => level.name
const levelItemValue = (level: Level) => level.id
const paddingBottom = computed(() => (meetup.value.timeslots.length || 1) * 80)

const onExportingButtonClicked = () => {
    const records = []
    for (const { profile, statuses } of items.value) {
        const record: any = {
            "": profile.name,
        }
        let attending = false
        for (const { id: timeslotId, startTime, endTime } of meetup.value.timeslots) {
            const status = statuses[timeslotId]
            if (!status) continue
            if (!(status === SignUpStatuses.Accepted || status === SignUpStatuses.Paid)) {
                record[`${startTime}\n${endTime}`] = ""
                continue
            }
            attending = true
            record[`${startTime}\n${endTime}`] = "O"
        }
        if (attending) records.push(record)
    }
    const blob = fromJsonToXlsxBlob(records)
    downloadBlob(blob, `${meetup.value.name}.xlsx`)
}

const copyPublicURL = () => {
    const { public: { publicURL } } = useRuntimeConfig()
    copyTextToClipboard(`${publicURL}/groups/${groupId}/meetups/${meetupId}`, () => showSuccess(`已複製報名網址到剪貼簿`))
}

const sendingMessageDialog = ref() as Ref<InstanceType<typeof SendingMessageDialog>>

const copyUserId = (userId: string) => {
    copyTextToClipboard(userId, () => showSuccess(`已複製使用者編號至剪貼簿`))
}
</script>

<template>
    <SendingMessageDialog ref="sendingMessageDialog" :groupId="groupId" />
    <v-container :style="{ paddingBottom: `${paddingBottom}px` }">
        <v-card flat>
            <v-card-title>
                <a style="cursor: pointer;" @click="() => copyPublicURL()">
                    {{ meetup.name }}
                </a>
            </v-card-title>
            <v-card-item>
                <v-row justify="space-between" :align="'center'">
                    <v-col cols="auto">
                        <v-card-subtitle>
                            {{ meetup.date }}
                        </v-card-subtitle>
                    </v-col>
                    <v-col cols="auto">
                        <v-avatar :size="24">
                            <v-btn icon="mdi-printer" @click="() => onExportingButtonClicked()" />
                        </v-avatar>
                    </v-col>
                </v-row>
            </v-card-item>
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
                                <v-list-item v-bind="props" :subtitle="description" flat>
                                    <template #prepend>
                                        <v-icon icon="mdi-circle" :color="color" size="xs" />
                                    </template>
                                    <template #title>
                                        {{ name }}
                                    </template>
                                    <template #subtitle>
                                        {{ description }}
                                    </template>
                                </v-list-item>
                            </template>
                        </v-select>
                    </v-col>
                </v-row>
            </v-card-actions>
            <v-divider />

            <v-data-table-server :items-per-page="itemsPerPage" :headers="headers" :items="items"
                :items-length="itemLength" :loading="loading" :search="search" item-value="id" disable-items-per-page
                :page="1" hide-default-footer>
                <template #item.order="{ index }">
                    {{ index + 1 }}
                </template>
                <template #[`header.${timeslotId}`] v-for="{ id: timeslotId, startTime, endTime } in meetup.timeslots">
                    {{ startTime }} <br />
                    {{ endTime }}
                </template>
                <template #item.user="{ item: { profile: { name, line, levelId }, user, userId } }">
                    <v-list flat>
                        <v-list-item>
                            <template #title>{{ name }}</template>
                            <template #subtitle>{{ line }}</template>
                            <template #prepend>
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
                        </v-list-item>
                    </v-list>
                </template>
                <template #item.messaging="{ item: { profile: {  name, token } } }">
                    <template v-if="token">
                        <v-btn icon="mdi-message" size="x-small" @click="() => sendingMessageDialog.open({ name, token })"/>
                    </template>
                </template>
                <template #item.markAsPaid="{ item: { user: { id: userId }, statuses, updatedAt } }">
                    <v-btn @click="() => onMarkAsPaidButtonClicked(userId, statuses)" v-show="payable(userId, statuses)"
                        flat :key="updatedAt">收款</v-btn>
                </template>
                <template #[`item.${timeslotId}`]="{ item: { statuses, user: { id: userId } } }" v-for="{ id: timeslotId } in meetup.timeslots">
                    <TempVar :define="{ status: statuses[timeslotId], signUpId: signUpIdOf(userId, timeslotId)! }"
                        #default="{ status, signUpId }" v-if="statuses[timeslotId] && signUpIdOf(userId, timeslotId)">
                        <template v-if="loadingsMap[signUpId]">
                            <v-btn flat disabled :loading="true" />
                        </template>
                        <template v-else>
                            <template v-if="status === SignUpStatuses.Pending">
                                <v-badge color="warning">
                                    <v-btn flat @click="() => onAcceptedButtonClicked(userId, timeslotId)">
                                        錄取
                                    </v-btn>
                                    <template #badge>
                                        <v-icon icon="mdi-exclamation" />
                                    </template>
                                </v-badge>
                            </template>
                            <template v-if="status === SignUpStatuses.Accepted">
                                <v-badge color="success">
                                    <v-btn flat @click="() => onRevokeButtonClicked(userId, timeslotId)">
                                        取消
                                    </v-btn>
                                    <template #badge>
                                        <v-icon icon="mdi-check" />
                                    </template>
                                </v-badge>
                            </template>
                            <template v-if="status === SignUpStatuses.Paid">
                                <v-badge color="info">
                                    <v-btn flat @click="() => onMarkAsRefunedButtonClicked(userId, timeslotId)">
                                        退款
                                    </v-btn>
                                    <template #badge>
                                        <v-icon icon="mdi-check" />
                                    </template>
                                </v-badge>
                            </template>
                            <template v-if="status === SignUpStatuses.Cancelled">
                                <v-badge color="pink">
                                    <v-btn flat disabled>
                                        已取消
                                    </v-btn>
                                    <template #badge>
                                        <v-icon icon="mdi-close" />
                                    </template>
                                </v-badge>
                            </template>
                            <template v-if="status === SignUpStatuses.Revoked">
                                <v-badge color="pink">
                                    <v-btn flat disabled>
                                        已取消
                                    </v-btn>
                                    <template #badge>
                                        <v-icon icon="mdi-close" />
                                    </template>
                                </v-badge>
                            </template>
                            <template v-if="status === SignUpStatuses.Refunded">
                                <v-badge color="pink">
                                    <v-btn flat disabled>
                                        已退款
                                    </v-btn>
                                    <template #badge>
                                        <v-icon icon="mdi-close" />
                                    </template>
                                </v-badge>
                            </template>
                        </template>
                    </TempVar>
                </template>
            </v-data-table-server>
        </v-card>
    </v-container>
    <SignUpStats :timeslots="meetup.timeslots" :levelsStats="levelsStats" :attendingsStats="attendingsStats"
        :levels="levels" />
</template>

<style scoped>
:deep(table) {
    table-layout: fixed;
}

.v-btn {
    @apply px-0;
}
</style>