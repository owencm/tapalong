//
//  CreateActivityViewController.m
//  Activities
//
//  Created by Owen Campbell-Moore on 29/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import <RestKit/RestKit.h>
#import "CreateActivityViewController.h"
#import "GlobalColors.h"
#import "Activity.h"

@interface CreateActivityViewController ()

@end

@implementation CreateActivityViewController

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        [[self view] setBackgroundColor:[[GlobalColors sharedGlobal] backgroundGrey]];
    }
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    
    Activity *activity = [[Activity alloc] init];
    activity.title = @"title";
    activity.description = @"description";
    activity.location = @"location";
    activity.max_attendees = @"maxatendees";
    activity.start_time = @"time";
    
    [self requestCreateActivity:activity];
}

- (void)requestCreateActivity:(Activity *)activity
{
    RKObjectManager *manager = [RKObjectManager managerWithBaseURL:[NSURL URLWithString:@"http://127.0.0.1:8000"]];
    
    // Define the object mapping
    RKObjectMapping *activityMapping = [RKObjectMapping requestMapping];
    // TODO: These are the symmetric so it doesn't matter, but using the same for requests and responses requires the use of [mapping inverseMapping]
    [activityMapping addAttributeMappingsFromDictionary:@{
         @"title": @"title",
         @"start_time": @"start_time",
         @"location": @"location",
         @"max_attendees": @"max_attendees",
         @"description": @"description"
     }];
    
    RKRequestDescriptor *requestDescriptor = [RKRequestDescriptor requestDescriptorWithMapping:activityMapping objectClass:[Activity class] rootKeyPath:nil method:RKRequestMethodPOST];
    
    [manager addRequestDescriptor: requestDescriptor];
    
    [manager postObject:activity path:@"/activities/1/" parameters:nil success:^(RKObjectRequestOperation *operation, RKMappingResult *mappingResult) {
        NSLog(@"\n\nSuccessful Post!\n");
    } failure:^(RKObjectRequestOperation *operation, NSError *error) {
        NSLog(@"\n\nFail|n");
    }];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

@end
