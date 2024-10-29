import { translateError } from "~/lib/utils/formatters"
import { showError, showSuccess } from "~/composables/utils/useSnackbar"

export type SendingMessage = {
    token: string
    title?: string
    body: string
}

export const onSendingMessage = async (groupId: string, data: SendingMessage) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = `/groups/:groupId/messages`.replace(`:groupId`, groupId)
    try {
        const {
            data: {
                payload: { messageId },
            },
        } = await axios.post<{ payload: { messageId: string } }>(uri, data)
        showSuccess(`已成功發送訊息`)
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
