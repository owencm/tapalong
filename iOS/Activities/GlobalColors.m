//
//  GlobalColors.m
//  Activities
//
//  Created by Owen Campbell-Moore on 29/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import "GlobalColors.h"

static GlobalColors *sharedGlobalInstance = nil;

@implementation GlobalColors

#pragma mark Singleton Methods
+ (id)sharedGlobal {
    @synchronized(self) {
        if (sharedGlobalInstance == nil)
            sharedGlobalInstance = [[self alloc] init];
    }
    return sharedGlobalInstance;
}

- (id)init {
    if (self = [super init]) {
        self.backgroundGrey = [UIColor colorWithRed:0.94 green:0.94 blue:0.94 alpha:1];
        self.backgroundGreyImage = [UIImage imageNamed:@"backgroundGrey.png"];
        self.redImage = [UIImage imageNamed:@"red.png"];
        self.red = [[UIColor alloc] initWithRed:0.0 / 255 green:204.0 / 255 blue:51.0 / 204 alpha:1.0];
        
        // Colors for text
        self.darkGreyText = [UIColor colorWithRed:0.1 green:0.1 blue:0.1 alpha:1];
        self.lightGreyText = [UIColor colorWithRed:0.2 green:0.2 blue:0.2 alpha:1];
        self.linkBlue = [UIColor colorWithRed:0.2 green:0.7 blue:0.89 alpha:1];
    }
    return self;
}


@end
