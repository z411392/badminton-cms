<script lang="ts" setup>
import { type Playlist } from "~/lib/modules/PlaylistManaging/dtos/Playlist"
import * as validators from "~/lib/modules/PlaylistManaging/presentation/validators/Playlist"
import { onCreatingPlaylist } from "~/lib/modules/PlaylistManaging/presentation/controllers/onCreatingPlaylist"
import { onUpdatingPlaylist } from "~/lib/modules/PlaylistManaging/presentation/controllers/onUpdatingPlaylist"

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

const stopWatching = ref<Function>()
const loading = ref(false)

const onSaveButtonClicked = async () => {
    loading.value = true
    if (id.value) await onUpdatingPlaylist(groupId, id.value, unref(mutation))
    else await onCreatingPlaylist(groupId, unref(mutation))
    loading.value = false
    reload()
    close()
}

const mutation = computed(() => {
    return {
        name: name.value,
    }
})

const open = async (playlist?: Playlist) => {
    touched.value = false
    opened.value = true
    if (playlist) {
        const copy = JSON.parse(JSON.stringify(playlist)) as Playlist
        title.value = "編輯播放清單"
        id.value = copy.id
        name.value = copy.name
    } else {
        title.value = "新增播放清單"
        id.value = undefined
        name.value = ""
    }
    stopWatching.value = watch(mutation, () => touched.value = true, { deep: true })
}

const close = () => {
    opened.value = false
    stopWatching.value?.()
    
}

onBeforeUnmount(() => close())

defineExpose({
    open,
})
</script>

<template>
    <v-dialog width="auto" v-model="opened" :persistent="touched" :width="320">
        <v-card :loading="loading">
            <v-card-title>
                {{ title }}
            </v-card-title>
            <v-card-text>
                <v-form v-model="valid" @submit.prevent="">
                    <v-container>
                        <v-row>
                            <v-col cols="12">
                                <v-text-field label="播放清單名稱" v-model="name" clearable counter variant="underlined"
                                    :rules="nameRules" />
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