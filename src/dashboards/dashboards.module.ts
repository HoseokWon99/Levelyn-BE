import { Module } from '@nestjs/common';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Dashboard } from "./model";

@Module({
    imports: [TypeOrmModule.forFeature([Dashboard])]
})
export class DashboardsModule {}
