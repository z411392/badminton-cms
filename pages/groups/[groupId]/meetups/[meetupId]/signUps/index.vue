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
        }
        yield {
            title: '成員',
            sortable: false,
            key: 'user',
        }
        yield {
            title: '',
            sortable: false,
            key: 'markAsPaid',
        }
        for (const { id: timeslotId, startTime, endTime } of meetup.value.timeslots) {
            yield {
                title: `${startTime}-${endTime}`,
                sortable: false,
                key: timeslotId,
            }
        }
    }
    return Array.from(headers())
})

const user = getAuth().currentUser!
const userId = user.uid

const { signUps, levelsStats, attendingsStats, signUpIdOf, loadingsMap } = useSignUps({ groupId, meetupId, userId })

const items = computed(() => signUps.value.filter(({ user, profile, statuses }) => {
    let attending = false
    for (const timeslotId in statuses) {
        const status = statuses[timeslotId]
        if (!(status === SignUpStatuses.Pending || status === SignUpStatuses.Accepted || status === SignUpStatuses.Paid)) continue
        attending = true
        break
    }
    if (!attending) return false
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
</script>

<template>
    <v-main>
        <v-container>
            <v-card flat>
                <v-card-title>
                    {{ meetup.name }}
                </v-card-title>
                <v-card-subtitle>
                    {{ meetup.date }}
                </v-card-subtitle>
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
                    disable-items-per-page :page="1" hide-default-footer>
                    <template #item.order="{ index }">
                        {{ index + 1 }}
                    </template>
                    <template #item.user="{ item: { profile: { name, line, levelId }, user } }">
                        <v-list>
                            <v-list-item>
                                <template #title>{{ name }}</template>
                                <template #subtitle>{{ line }}</template>
                                <template #prepend>
                                    <TempVar :define="{ level: levelsMap[levelId] }" #default="{ level: { color } }"
                                        v-if="levelsMap[levelId]">
                                        <v-badge :color="color" dot>
                                            <v-avatar>
                                                <template v-if="user.photoURL">
                                                    <v-img :src="user.photoURL">
                                                        <template #error>
                                                            <v-icon icon="mdi-account-circle" :size="40"
                                                                color="white" />
                                                        </template>
                                                    </v-img>
                                                </template>
                                                <template v-else>
                                                    <v-icon icon="mdi-account-circle" :size="40" color="white" />
                                                </template>
                                            </v-avatar>
                                        </v-badge>
                                    </TempVar>
                                </template>
                            </v-list-item>
                        </v-list>
                    </template>
                    <template #item.markAsPaid="{ item: { user: { id: userId }, statuses, updatedAt } }">
                        <v-btn @click="() => onMarkAsPaidButtonClicked(userId, statuses)"
                            v-show="payable(userId, statuses)" flat :key="updatedAt">收款</v-btn>
                    </template>
                    <template #[`item.${timeslotId}`]="{ item: { statuses, user: { id: userId } } }"
                        v-for="{ id: timeslotId } in meetup.timeslots">
                        <TempVar :define="{ status: statuses[timeslotId], signUpId: signUpIdOf(userId, timeslotId)! }"
                            #default="{ status, signUpId }"
                            v-if="statuses[timeslotId] && signUpIdOf(userId, timeslotId)">
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
    </v-main>
</template>