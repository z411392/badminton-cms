<script lang="ts" setup>
import { Pages } from "~/lib/constants"
import { PageSizes } from "~/lib/constants"
import { withMeetup } from "~/lib/utils/sessions"
import TempVar from "vue-temp-var"
import { SignUpStatuses } from "~/lib/modules/SignUpManaging/dtos/SignUpStatuses"
import { onReviewingSignUp } from "~/lib/modules/SignUpManaging/presentation/controllers/onReviewingSignUp"
import SignUpStats from "~/components/groups/[groupId]/meetups/[meetupId]/signUps/SignUpStats.vue"
import { useSignUps } from "~/composables/groups/[groupId]/meetups/[meetupId]/signUps/useSignUps"
import { type Level } from "~/lib/modules/LevelManaging/dtos/Level"
import { useLevels } from "~/composables/groups/[groupId]/meetups/[meetupId]/signUps/useLevels"

definePageMeta({
    name: Pages.SignUps.name,
})

const itemsPerPage = PageSizes.SignUps
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
        for (let index = 0; index < meetup.value.plans.length; index += 1) {
            const { startTime, endTime } = meetup.value.plans[index]
            yield {
                title: `${startTime}-${endTime}`,
                sortable: false,
                key: String(index),
            }
        }
    }
    return Array.from(headers())
})

const { signUps, signUpsMap, lastUpdated } = useSignUps(groupId, meetupId)

const items = computed(() => signUps.value.filter(({ user, profile, statuses }) => {
    let attending = false
    for (const index in statuses) {
        const status = statuses[index]
        if (!(status === SignUpStatuses.Accepted || status === SignUpStatuses.Paid)) continue
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

const payable = (signUpId: string, statuses: { [index: string]: SignUpStatuses }) => {
    for (const index in statuses) {
        const status = statuses[index]
        if (status === SignUpStatuses.Accepted) return true
    }
    return false
}

const onMarkAsPaidButtonClicked = async (signUpId: string, statuses: { [index: string]: SignUpStatuses }) => {
    const promises: Promise<any>[] = []
    for (const index in statuses) {
        const status = statuses[index]
        if (status !== SignUpStatuses.Accepted) continue
        signUpsMap.value[signUpId].statuses[index] = SignUpStatuses.Transiting
        promises.push(
            onReviewingSignUp(groupId, meetupId, signUpId, {
                index: Number(index),
                status: SignUpStatuses.Paid,
            })
        )
    }
    await Promise.all(promises)
}

const onAcceptedButtonClicked = async (signUpId: string, index: number) => {
    signUpsMap.value[signUpId].statuses[index] = SignUpStatuses.Transiting
    const status = SignUpStatuses.Accepted
    await onReviewingSignUp(groupId, meetupId, signUpId, {
        index,
        status,
    })
}

const onRevokeButtonClicked = async (signUpId: string, index: number) => {
    signUpsMap.value[signUpId].statuses[index] = SignUpStatuses.Transiting
    const status = SignUpStatuses.Revoked
    await onReviewingSignUp(groupId, meetupId, signUpId, {
        index,
        status,
    })
}

const onMarkAsRefunedButtonClicked = async (signUpId: string, index: number) => {
    signUpsMap.value[signUpId].statuses[index] = SignUpStatuses.Transiting
    const status = SignUpStatuses.Refunded
    await onReviewingSignUp(groupId, meetupId, signUpId, {
        index,
        status,
    })
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
                    <template #item.user="{ item: { user, profile: { name, levelId, line } } }">
                        <v-list>
                            <v-list-item>
                                <template #title>{{ name }}</template>
                                <template #subtitle>{{ line }}</template>
                                <template #prepend>
                                    <template v-if="levelsMap[levelId]">
                                        <TempVar :define="{ level: levelsMap[levelId] }"
                                            #default="{ level: { color } }">
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
                                </template>
                            </v-list-item>
                        </v-list>
                    </template>
                    <template #item.markAsPaid="{ item: { updatedAt, statuses, id: signUpId } }">
                        <v-btn @click="() => onMarkAsPaidButtonClicked(signUpId, statuses)"
                            v-show="payable(signUpId, statuses)" flat :key="updatedAt">收款</v-btn>
                    </template>
                    <template #[`item.${index}`]="{ item: { id: signUpId, statuses } }"
                        v-for="(_, index) in meetup.plans">
                        <template v-if="statuses[index]">
                            <TempVar :define="{ status: statuses[index], index: Number(index) }"
                                #default="{ status, index }">
                                <template v-if="status === SignUpStatuses.Transiting">
                                    <v-btn flat disabled :loading="true" />
                                </template>
                                <template v-if="status === SignUpStatuses.Pending">
                                    <v-badge color="warning">
                                        <v-btn flat @click="() => onAcceptedButtonClicked(signUpId, index)">
                                            錄取
                                        </v-btn>
                                        <template #badge>
                                            <v-icon icon="mdi-exclamation" />
                                        </template>
                                    </v-badge>
                                </template>
                                <template v-if="status === SignUpStatuses.Accepted">
                                    <v-badge color="success">
                                        <v-btn flat @click="() => onRevokeButtonClicked(signUpId, index)">
                                            取消　
                                        </v-btn>
                                        <template #badge>
                                            <v-icon icon="mdi-check" />
                                        </template>
                                    </v-badge>
                                </template>
                                <template v-if="status === SignUpStatuses.Paid">
                                    <v-badge color="info">
                                        <v-btn flat @click="() => onMarkAsRefunedButtonClicked(signUpId, index)">
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
                            </TempVar>
                        </template>
                    </template>
                </v-data-table-server>
            </v-card>
        </v-container>
        <SignUpStats :key="lastUpdated" :plans="meetup.plans" :signUps="signUps" :levels="levels" />
    </v-main>
</template>