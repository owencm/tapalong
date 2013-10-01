//
//  AppDelegate.h
//  Activities
//
//  Created by Owen Campbell-Moore on 27/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "Activities.h"

@interface AppDelegate : UIResponder <UIApplicationDelegate>

{
    UINavigationController *navigationController;
}

@property (strong, nonatomic) UINavigationController *navigationController;
@property (strong, nonatomic) UIWindow *window;
@property (strong, nonatomic) Activities *activities;

- (void)openSession;

@end
