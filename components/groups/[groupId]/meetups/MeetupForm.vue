<script lang="ts" setup>
import { type MeetupEnriched } from "~/lib/modules/MeetupManaging/presentation/controllers/onListingMeetups"
import * as validators from "~/lib/modules/MeetupManaging/presentation/validators/Meetup"
import { date as dateValidator } from "~/lib/utils/validators"
import { type Plan } from "~/lib/modules/MeetupManaging/dtos/Plan"
import PlanTab from "~/components/groups/[groupId]/meetups/PlanTab.vue"
import { DateTime } from "luxon"
import { type Venue } from "~/lib/modules/VenueManaging/dtos/Venue"
import VenueAutoComplete from "~/components/groups/[groupId]/meetups/VenueAutoComplete.vue"
import { type Shuttle } from "~/lib/modules/ShuttleManaging/dtos/Shuttle"
import ShuttlesAutoComplete from "~/components/groups/[groupId]/meetups/ShuttlesAutoComplete.vue"
import { type Playlist } from "~/lib/modules/PlaylistManaging/dtos/Playlist"
import PlaylistAutoComplete from "~/components/groups/[groupId]/meetups/PlaylistAutoComplete.vue"
import { onCreatingMeetup } from "~/lib/modules/MeetupManaging/presentation/controllers/onCreatingMeetup"
import { onUpdatingMeetup } from "~/lib/modules/MeetupManaging/presentation/controllers/onUpdatingMeetup"

const { reload, groupId } = defineProps<{ reload: Function, groupId: string }>()

const opened = ref(false)
const touched = ref(false)
const valid = ref(true)
const title = ref("")

const id = ref<string>()
const name = ref<string>("")
const nameRules = [
    (value: string) => {
        const { error } = validators.name.validate(value)
        if (error) return error.message
        return true
    },
]
const date = ref<string>("")
const dateRules = [
    (value: string) => {
        const { error } = dateValidator.validate(value)
        if (error) return error.message
        return true
    },
]

const description = ref<string>("")
const descriptionRules = [
    (value: string) => {
        const { error } = validators.description.validate(value)
        if (error) return error.message
        return true
    },
]

const plans = ref<Plan[]>([])
const venue = ref<Venue>()
const shuttles = ref<Shuttle[]>([])
const playlist = ref<Playlist>()
const stopWatching = ref<Function>()
const loading = ref(false)

const onSaveButtonClicked = async () => {
    loading.value = true
    if (id.value) await onUpdatingMeetup(groupId, id.value, unref(mutation))
    else await onCreatingMeetup(groupId, unref(mutation))
    loading.value = false
    reload()
    close()
}

const mutation = computed(() => {
    return {
        name: name.value,
        date: date.value,
        description: description.value,
        plans: plans.value,
        venueId: venue.value?.id as string,
        shuttleIds: shuttles.value!.map(({ id }) => id),
        playlistId: playlist.value?.id,
    }
})

const open = async (meetup?: MeetupEnriched) => {
    touched.value = false
    opened.value = true
    if (meetup) {
        const copy = JSON.parse(JSON.stringify(meetup)) as MeetupEnriched
        title.value = "編輯球敘"
        id.value = copy.id
        name.value = copy.name
        date.value = copy.date
        description.value = copy.description
        plans.value = copy.plans
        venue.value = copy.venue
        shuttles.value = copy.shuttles
        playlist.value = copy.playlist
    } else {
        title.value = "新增球敘"
        id.value = undefined
        name.value = ""
        date.value = ""
        description.value = ""
        plans.value = [createPlan()]
        venue.value = undefined
        shuttles.value = []
        playlist.value = undefined
    }
    stopWatching.value = watch(mutation, () => touched.value = true, { deep: true })
}

const close = () => {
    opened.value = false
    stopWatching.value?.()
    stopWatching.value = undefined
}

onBeforeUnmount(() => close())

defineExpose({
    open,
})
const tab = ref(0)

const createPlan = () => {
    const now = DateTime.now()
    const timeFormat = "HH:mm"
    const startTime = now.startOf("hour").toFormat(timeFormat)
    const endTime = now.endOf("hour").toFormat(timeFormat)
    const plan: Plan = {
        courts: 0,
        capacity: 0,
        reserved: 0,
        fee: 0,
        startTime,
        endTime,
    }
    return plan
}
const addPlan = () => plans.value.push(createPlan())
const removePlan = (index: number) => plans.value.splice(index, 1)
</script>

<template>
    <v-dialog width="auto" v-model="opened" :persistent="touched" :min-width="360">
        <v-card :title="title" class="rounded-lg" :loading="loading">
            <v-card-text>
                <v-form :v-model="valid" @submit.prevent="">
                    <v-container>
                        <v-row>
                            <v-col :cols="12">
                                <v-text-field label="標題" v-model="name" clearable counter variant="underlined"
                                    :rules="nameRules" />
                            </v-col>
                            <v-col :cols="12">
                                <v-text-field label="日期" v-model="date" clearable counter variant="underlined"
                                    :rules="dateRules" type="date" />
                            </v-col>
                            <v-col :cols="12">
                                <v-textarea label="說明" v-model="description" clearable counter variant="underlined"
                                    :rules="descriptionRules" :rows="4" />
                            </v-col>
                            <v-col :cols="12" :sm="6">
                                <VenueAutoComplete v-model="venue" />
                            </v-col>
                            <v-col :cols="12" :sm="6">
                                <ShuttlesAutoComplete v-model="shuttles" />
                            </v-col>
                            <v-col :cols="12">
                                <PlaylistAutoComplete :groupId="groupId" v-model="playlist" />
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col :cols="12">
                                場次資訊
                                <v-btn variant="plain" icon="mdi-plus-circle" :ripple="false" @click="addPlan" />
                            </v-col>
                            <v-col :cols="12">
                                <v-tabs v-model="tab" show-arrows>
                                    <template v-for="(_, index) in plans">
                                        <v-tab :value="index">
                                            <v-row>
                                                <v-col> 場次 {{ index + 1 }} </v-col>
                                                <v-spacer />
                                                <template v-if="plans.length > 1">
                                                    <v-col>
                                                        <v-icon icon="mdi-close-circle" @click="removePlan(index)" />
                                                    </v-col>
                                                </template>
                                            </v-row>
                                        </v-tab>
                                    </template>
                                </v-tabs>
                            </v-col>
                            <v-col :cols="12">
                                <v-window v-model="tab">
                                    <template v-for="(_, index) in plans">
                                        <v-window-item :value="index">
                                            <PlanTab v-model:courts="plans[index].courts"
                                                v-model:capacity="plans[index].capacity"
                                                v-model:reserved="plans[index].reserved" v-model:fee="plans[index].fee"
                                                v-model:start-time="plans[index].startTime"
                                                v-model:end-time="plans[index].endTime" />
                                        </v-window-item>
                                    </template>
                                </v-window>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text="取消" @click="close" :disabled="loading" />
                <v-btn text="儲存" @click="onSaveButtonClicked" :disabled="!valid || !touched" :loading="loading" />
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>