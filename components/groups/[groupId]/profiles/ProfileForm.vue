<script lang="ts" setup>
import { type Profile } from "~/lib/modules/ProfileManaging/dtos/Profile"
import * as validators from "~/lib/modules/ProfileManaging/presentation/validators/Profile"
import { onCreatingProfile } from "~/lib/modules/ProfileManaging/presentation/controllers/onCreatingProfile"
import { onUpdatingProfile } from "~/lib/modules/ProfileManaging/presentation/controllers/onUpdatingProfile"

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

const levelId = ref<string>("")
const levelIdRules = [
    (value: string) => {
        const { error } = validators.levelId.validate(value)
        if (error) return error.message
        return true
    },
]

const line = ref<string>("")
const lineRules = [
    (value: string) => {
        const { error } = validators.line.validate(value)
        if (error) return error.message
        return true
    },
]

const stopWatching = ref<Function>()
const loading = ref(false)

const onSaveButtonClicked = async () => {
    loading.value = true
    if (id.value) await onUpdatingProfile(groupId, id.value, unref(mutation))
    else { }
    loading.value = false
    reload()
    close()
}

const mutation = computed(() => {
    return {
        name: name.value,
        levelId: levelId.value,
        line: line.value,
    }
})

const open = async (profile?: Profile) => {
    touched.value = false
    opened.value = true
    if (profile) {
        const copy = JSON.parse(JSON.stringify(profile)) as Profile
        title.value = "編輯基本資料"
        id.value = copy.id
        name.value = copy.name
        levelId.value = copy.levelId
        line.value = copy.line
    } else {
        title.value = "新增基本資料"
        id.value = undefined
        name.value = ""
        levelId.value = ""
        line.value = ""
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
                                <v-text-field label="暱稱" v-model="name" clearable counter variant="underlined"
                                    :rules="nameRules" />
                            </v-col>
                            <v-col cols="12">
                                <v-text-field label="分級" v-model="levelId" clearable counter variant="underlined"
                                    :rules="levelIdRules" />
                            </v-col>
                            <v-col cols="12">
                                <v-text-field label="LINE ID" v-model="line" clearable counter variant="underlined"
                                    :rules="lineRules" />
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