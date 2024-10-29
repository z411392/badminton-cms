<script lang="ts" setup>
import { onSendingMessage } from "~/lib/modules/Notifying/presentation/controllers/onSendingMessage"

const { groupId } = defineProps<{ groupId: string }>()

const opened = ref(false)
const name = ref("")
const token = ref("")

const title = ref("")
const body = ref("")

const open = (profile: { name: string, token: string }) => {
    opened.value = true
    name.value = profile.name
    token.value = profile.token
}
const close = () => opened.value = false

const loading = ref(false)

const onSendMessageButtonClicked = async (token: string) => {
    loading.value = true
    await onSendingMessage(groupId, {
        token,
        title: title.value || undefined,
        body: body.value,
    })
    title.value = ""
    body.value = ""
    loading.value = false
    close()
}

defineExpose({
    open,
    close,
})
</script>

<template>
    <v-dialog :width="320" v-model="opened">
        <v-card flat :loading="loading">
            <v-card-title>
                <small>發送訊息</small>
            </v-card-title>
            <v-card-subtitle>
                想對{{ name }}說點什麼嗎？
            </v-card-subtitle>
            <v-card-item>
                <v-text-field label="標題" v-model="title" hide-details variant="underlined" />
                <v-divider :thickness="16" />
                <v-textarea label="內容" v-model="body" no-resize hide-details variant="underlined" />
            </v-card-item>
            <v-card-actions>
                <v-row justify="center">
                    <v-col cols="auto">
                        <v-btn @click="() => onSendMessageButtonClicked(token)" variant="elevated" :elevation="1"
                            :loading="loading">發送訊息</v-btn>
                    </v-col>
                </v-row>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>