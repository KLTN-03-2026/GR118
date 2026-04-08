export interface ActionGetMe {
    name: string;
}


export interface PermissionGetMe {
    permission: string;
    resource: string;
    actions: ActionGetMe[] | null;
}


export interface GetMeInterface {
    user_id: string;
    username: string;
    email: string;
    lockEnd: Date | null;
    lockReason: string | null;
    permissions: PermissionGetMe[] | null;
}